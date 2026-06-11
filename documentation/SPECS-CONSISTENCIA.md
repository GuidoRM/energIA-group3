# Specs de Consistencia del Sistema — Austral Energy Optimizer

> **Estado base:** el sistema funciona end-to-end. Hermes responde, las proyecciones
> se guardan, las alertas se crean. Este documento define **qué hay que arreglar**
> para que todo sea coherente y predecible.

---

## 1. Multi-chat en la sección Agente

### Estado actual (problema)

`agent/page.tsx` carga la conversación **más reciente** y la muestra directamente
en `ChatWindow`. No hay forma de ver conversaciones anteriores ni iniciar una nueva.
Si el usuario quiere hablar sobre otro tema, su mensaje queda pegado en el hilo anterior.

La infraestructura ya existe:
- `conversationService.listByCompany()` devuelve todas las conversaciones
- `conversationService.create()` crea una nueva
- `conversationService.listMessages()` carga los mensajes de cualquier hilo
- El chat API ya acepta `conversationId` opcional; si no se envía, crea uno nuevo

Lo que falta es la UI.

### Diseño propuesto

La ruta `agent` se convierte en un layout de dos paneles:

```
┌─────────────────────────────────────────────────────────┐
│  [+ Nueva conversación]                                  │ ← panel lateral
│ ─────────────────────────────────────────────────────── │
│  ● hoy 14:23   "Agregué el horno a..."      (activa)    │
│    ayer 09:11  "¿Cuánto gasto en julio?"               │
│    14/06/26    "Primera configuración"                  │
├─────────────────────────────────────────────────────────┤
│                                                          │ ← ChatWindow
│           [ mensajes de la conversación activa ]         │
│                                                          │
│  ┌─────────────────────────────────┐  [Enviar]          │
│  │ Escribí un mensaje…             │                    │
│  └─────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Implementación

**Cambio de URL:** el `companyId` activo va en la URL de siempre. El `conversationId`
activo va como search param:

```
/companies/[companyId]/agent              → abre la más reciente (o vacío)
/companies/[companyId]/agent?c=[uuid]     → abre esa conversación
```

**Archivos a crear / modificar:**

| Archivo | Cambio |
|---|---|
| `app/(app)/companies/[companyId]/agent/page.tsx` | Server component: carga lista de conversaciones + mensajes del `c` param. Renderiza `AgentLayout` |
| `components/chat/conversation-sidebar.tsx` | Client component: lista de conversaciones, botón "Nueva", highlight activa |
| `components/chat/chat-window.tsx` | Recibe `conversationId` inicial; al recibir `start` SSE, actualiza URL con `?c=` sin recargar la página (using `router.replace`) |

**`ConversationSidebar` props:**
```typescript
{
  companyId: string
  conversations: Conversation[]     // cargadas server-side
  activeId: string | undefined
}
```

**Navegación:** clic en una conversación → `router.push(?c=id)`. El server component
recarga desde DB. No hay estado client-side de "qué conversación está abierta".

**"Nueva conversación":**
- Navega a `/companies/[companyId]/agent` (sin `?c=`)
- El ChatWindow arranca con `initialMessages=[]` e `initialConversationId=undefined`
- Al enviar el primer mensaje, el SSE devuelve `{type:"start", conversationId:"..."}` → el ChatWindow hace `router.replace(?c=nuevoid)` para que la URL se actualice sin recargar todo
- La próxima vez que el sidebar se actualice (por `router.refresh()` al final del stream), la nueva conversación aparece en la lista

**Títulos de conversación:**
- Hoy: no se auto-genera título (la columna `title` ya existe en el schema, default `null`)
- Mostrar: el primer mensaje del usuario truncado a 40 caracteres, o "Nueva conversación" si es null
- Se puede agregar `title` auto-generated más adelante (el modelo genera el título en background)

### Qué NO cambia

- El `ChatWindow` sigue siendo client component con streaming SSE
- El backend sigue resolviendo o creando conversaciones en `/api/companies/[id]/chat`
- La lógica de historial: el chat API carga los mensajes de la conversación indicada y los envía al modelo como contexto

---

## 2. ¿Hermes "aprende" entre conversaciones?

### Respuesta directa: NO

El proxy de Hermes (`hermes proxy start --port 8645`) es un **passthrough stateless**.
No almacena nada. Cada llamada al modelo es independiente.

Lo que sí hace el sistema: al llamar al modelo, el backend envía el **historial completo
de la conversación actual** como contexto. Esto le da "memoria" dentro de un hilo.

### Comportamiento exacto

```
Conversación A (ayer):
  Usuario: "Tengo 3 hornos eléctricos de 40kW"
  Hermes: OK, los agregué.
  [hermesService envía: [system, user, assistant] al modelo]

Conversación B (hoy):
  Usuario: "¿Cuántos hornos tengo?"
  Hermes: [no sabe de la conv A]
  [hermesService envía: [system, user] — sin historial de A]
```

Sin embargo, Hermes puede usar la tool `list_equipment` para consultar la DB y
responder correctamente, porque los datos YA están guardados. El "aprendizaje"
sucede en la DB, no en el modelo.

### ¿Qué implicaciones tiene para el usuario?

| Situación | Resultado |
|---|---|
| Le digo a Hermes que tengo 3 hornos | Los agrega a la DB vía tool. ✅ Se recuerda en toda la app |
| Abro una nueva conversación y pregunto por mis hornos | Hermes llama `list_equipment` y los ve. ✅ |
| Abro una nueva conv y digo "seguí desde donde quedamos" | Hermes no sabe de qué conv habla. ❌ |
| Continúo en la MISMA conversación | Hermes ve todo el historial anterior. ✅ |

### Qué mostrar en la UI

En el header de la sección Agente, o como tooltip:

> "Hermes recuerda todo lo que hablaste **en esta conversación**. Datos guardados
> (equipos, tarifas) son accesibles en cualquier hilo nuevo."

No hay que implementar memoria cross-conversación para el MVP — las tools que
consultan la DB ya cubren el caso de uso principal.

---

## 3. Barra de progreso del Perfil del Gemelo

### Estado actual (problema)

`profileCompletion` (0-100) y `onboardingStage` son columnas en la tabla `company`
que se actualizan **solo si alguien las escribe explícitamente** (vía `update_company`
tool o el endpoint PATCH `/api/companies/[id]`).

Si el usuario carga equipos por el formulario web, la barra sigue en 0%.
Si el agente agrega equipos, puede o no actualizar el stage (depende del prompt).

### Solución: cálculo automático por side-effect

Definir una función pura `computeStage` y llamarla desde cualquier operación
que modifica el estado relevante.

#### Reglas de progreso

| Stage | `profileCompletion` | Condición de activación |
|---|---|---|
| `identity` | **20%** | Empresa creada (siempre) |
| `equipment` | **40%** | Al menos 1 equipo en DB |
| `operation` | **60%** | Al menos 1 equipo con `hours_per_day > 0` Y `days_per_month > 0` |
| `tariffs` | **80%** | `gas_tariff IS NOT NULL` Y `electricity_tariff IS NOT NULL` |
| `complete` | **100%** | Al menos 1 proyección generada |

La función avanza secuencialmente: no puede llegar a `tariffs` sin pasar por `equipment`.

#### Implementación

**Nuevo archivo: `src/services/onboarding.service.ts`**
```typescript
// Computa y persiste el stage. Sin efecto si no hay cambio.
async function syncStage(companyId: string): Promise<void>
```

Pasos internos:
1. Carga `company`, `equipment count`, `equipment con horas`, `tariffs`, `projection count`
2. Determina `newStage` y `newPct` con las reglas de arriba
3. Si difiere del valor actual → `companyService.update({ onboardingStage, profileCompletion })`

**Trigger points (dónde llamar `syncStage`):**

| Evento | Dónde llamarlo |
|---|---|
| Crear empresa | `companyService.create()` — al final, llama `syncStage` |
| Agregar equipo | `equipmentService.create()` — al final |
| Editar equipo | `equipmentService.update()` — al final |
| Eliminar equipo | `equipmentService.remove()` — al final |
| Actualizar empresa (tariffs) | `companyService.update()` — al final |
| Crear proyección | `projectionService.compute()` — ya existe, agregar llamada |

**No** se llama en el agent tool `update_company` cuando escribe `onboardingStage`/`profileCompletion` manualmente — ese caso se sigue permitiendo para que el agente pueda forzar un stage si el usuario lo pide.

#### Comportamiento esperado

El usuario abre la empresa recién creada → barra al 20%.
Agrega un equipo via formulario → barra salta a 40% en el próximo render.
El layout de empresa carga `company` fresh en cada navegación (Server Component), así que no hace falta WebSocket ni polling.

---

## 4. Alertas — generación y visibilidad

### Estado actual

**Cómo se generan (correcto, no cambia):**
```
projectionService.compute()
  → variationPct = (totalConsumption - totalBase) / totalBase * 100
  → if |variationPct| > 15%: alertService.create(...)
  → severity: low (<20%), medium (<30%), high (≥30%)
```

**Dónde se muestran hoy:**
- Página `/companies/[id]/alerts` → lista completa con botón "Marcar leída"
- Página overview (`/companies/[id]`) → número de no leídas como tarjeta métrica
- Sidebar → **nada** ❌
- Tabs de la empresa → **nada** ❌
- El chat (cuando el agente corre una proyección) → **nada** ❌

### Inconsistencias a resolver

#### 4.1 Badge de alerta en la navegación de la empresa

El layout de empresa (`companies/[companyId]/layout.tsx`) ya tiene `requireSession` y
carga la empresa. Agregar:

```typescript
const unread = await alertService.countUnread(companyId);
```

Y mostrar el badge en la pestaña "Alertas" de `CompanyTabs`:

```
[ Resumen ]  [ Equipos ]  [ Proyecciones ]  [ Alertas 3 ]  [ Clima ]  [ Agente ]
                                                       ^^^
```

Solo mostrar si `unread > 0`. Badge con color `destructive` si hay alertas high,
`warning` si hay medium, `secondary` si solo hay low.

**Archivos afectados:**
- `companies/[companyId]/layout.tsx` → pasa `unread` a `CompanyTabs`
- `components/companies/company-tabs.tsx` → recibe y muestra badge

#### 4.2 Feedback inline en el chat cuando el agente genera una alerta

Cuando el agente llama `project_consumption` y el resultado genera una alerta,
el tool response ya contiene el `variationPct`. Si supera el 15%, el backend puede
emitir un SSE event adicional:

```json
{ "type": "alert", "severity": "medium", "message": "Se generó una alerta por..." }
```

El `ChatWindow` lo renderiza como un banner inline en el hilo:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️  Alerta media: variación del 22.4% en el consumo.     │
│    Revisá la sección Alertas.                            │
└──────────────────────────────────────────────────────────┘
```

**Archivos afectados:**
- `app/api/companies/[id]/chat/route.ts` → detectar si la tool response contiene alerta
- `components/chat/chat-window.tsx` → manejar `type:"alert"` event

#### 4.3 Badge en el `BadgeVariant` faltante

`AlertsList` usa `variant="warning"` en el Badge, pero este variant probablemente
no está definido en `components/ui/badge.tsx`. Verificar y agregar:

```css
/* en globals.css o en el componente */
--warning: oklch(0.85 0.15 80);
--warning-foreground: oklch(0.3 0.1 60);
```

O bien mapear `medium` → `secondary` (solución mínima sin agregar variant).

#### 4.4 Qué NO hacer con alertas

- No borrar alertas automáticamente — quedan como registro histórico
- No enviar emails/push por ahora (no hay canal configurado)
- No mostrar alertas de OTRAS empresas de la organización en el mismo panel

---

## 5. Clima — qué es y cómo se usa

### Qué son los datos de clima

La tabla `monthly_climate` contiene **datos históricos IPIEC** (Instituto Provincial
de Estadística y Censos de Tierra del Fuego), sembrados con `npm run db:seed`.

```
3 localidades × (2023-2025) × 12 meses = 108 filas
localidades: ushuaia | rio_grande | tolhuin
columna clave: mean_temp (°C)
```

Los datos son **deterministas** (jitter fijo por seed), no provienen de ninguna API
externa en tiempo real.

### Qué es la "temperatura prevista"

`climateService.forecastTempFor(location, month)` → **promedio histórico** del mes
en esa localidad:

```
forecastTemp(rio_grande, julio) = avg(mean_temp) donde location=rio_grande AND month=7
                                = (julio_2023 + julio_2024 + julio_2025) / 3
```

**Esto NO es un pronóstico meteorológico real.** Es la línea de base estadística.
La pantalla de Clima lo debe aclarar con un subtítulo:

> "Temperatura de referencia basada en datos históricos IPIEC 2023-2025"

### Inconsistencia actual: el formulario de proyección no pre-rellena la temperatura

La página de Proyecciones tiene un form que pide `forecastTemp` manualmente.
El usuario no sabe qué número poner. La sección de Clima muestra la temperatura
del mes actual pero está en otra pestaña.

#### Solución: pre-rellenar automáticamente

**`app/(app)/companies/[companyId]/projections/page.tsx`** (Server Component):

```typescript
const currentMonth = new Date().getMonth() + 1;
const forecast = await climateService.forecastTempFor(company.location, currentMonth);
// pasar forecast al ProjectionPanel como defaultForecastTemp
```

El usuario puede sobreescribir el valor si quiere simular otro escenario.

#### Solución: el agente también debe auto-obtener la temperatura

En `agent-tools.ts`, el tool `project_consumption` recibe `forecastTemp` como
parámetro requerido. Problema: el modelo inventa un número si no sabe cuál poner.

Opciones:
1. **Hacerlo opcional** — si el modelo no lo envía, el backend hace `forecastTempFor(company.location, currentMonth)` automáticamente
2. **Inyectarlo en el system prompt** — "La temperatura de referencia actual para esta empresa es X°C"

**Recomendado: opción 2** (inyectar en el system prompt del chat).

En `app/api/companies/[id]/chat/route.ts`:

```typescript
const forecast = await climateService.forecastTempFor(company.location, currentMonth);
const systemPrompt = buildSystemPrompt(company, forecast);
// → "... La temperatura de referencia estadística para {location} en {mes} es {forecast}°C. ..."
```

Así el modelo siempre tiene contexto climático y puede decidir informado si usar
ese valor o pedir uno diferente al usuario.

### Resumen del flujo clima → proyección

```
1. DB (seed)           → monthly_climate (datos históricos por localidad y mes)
2. climateService      → forecastTempFor(location, month) → promedio histórico
3. ProjectionPanel     → pre-rellena forecastTemp con ese promedio
4. projectionService   → compute(companyId, { forecastTemp }) → corre el modelo lineal
5. alert (si aplica)   → variationPct > 15% → crea alerta con mensaje descriptivo
```

El usuario puede sobreescribir el `forecastTemp` en cualquier punto para simular
escenarios ("¿qué pasa si hace -5°C?").

---

## Resumen de archivos a crear / modificar

| Archivo | Cambio |
|---|---|
| `components/chat/conversation-sidebar.tsx` | Nuevo — lista de conversaciones + botón Nueva |
| `app/(app)/companies/[companyId]/agent/page.tsx` | Refactor — soporta `?c=` param, renderiza sidebar |
| `components/chat/chat-window.tsx` | Maneja `type:"alert"` SSE + `router.replace` para URL |
| `services/onboarding.service.ts` | Nuevo — `syncStage(companyId)` |
| `services/equipment.service.ts` | Llama `syncStage` en create/update/remove |
| `services/company.service.ts` | Llama `syncStage` en create y update (tariffs) |
| `services/projection.service.ts` | Llama `syncStage` en compute |
| `app/(app)/companies/[companyId]/layout.tsx` | Pasa `unread` a CompanyTabs |
| `components/companies/company-tabs.tsx` | Muestra badge de alertas |
| `app/api/companies/[id]/chat/route.ts` | Inyecta forecast en system prompt; emite SSE `alert` |
| `app/(app)/companies/[companyId]/projections/page.tsx` | Pre-rellena forecast temp |
| `components/ui/badge.tsx` | Verificar/agregar variant `warning` |

---

## Orden de implementación sugerido

1. **Onboarding service** (syncStage) — es puro, sin UI, fácil de testear
2. **Alertas badge en tabs** — visible e inmediato
3. **Pre-rellenar forecast en proyecciones** — mejora UX sin complejidad
4. **Inyectar forecast en system prompt del chat** — mejora respuestas del agente
5. **Multi-chat sidebar** — más complejo, requiere refactor de la página de agente
6. **SSE alert event en chat** — nice-to-have para el MVP
