# Especificaciones Técnicas
## Asistente Optimizador de Recursos Energéticos para PyMEs Fueguinas

**IATHON Fueguina 2026 · Eje Innovación Productiva · Río Grande, Tierra del Fuego**

Documento de especificaciones para desarrollo asistido por IA.

---

## 1. Contexto y objetivo

Plataforma de gestión que construye un **gemelo digital** de cada PyME mediante un agente conversacional (Hermes), registra sus equipos consumidores de energía y **predice el consumo y el costo energético a partir del clima**. La relación clima→consumo está validada con datos del IPIEC: la temperatura explica el **90% de la variación del consumo de gas** (r = -0,95).

El sistema tiene tres caras sobre **una sola base de datos**: una UI web (lo que ve el usuario), una API REST (la consume la UI) y un servidor MCP (lo consume Hermes para leer/escribir datos mientras conversa).

---

## 2. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript** | Server Components para lectura, Client Components para chat |
| Estilos | **Tailwind CSS + shadcn/ui** | Componentes rápidos, consistentes |
| Backend | **Next.js Route Handlers** (`/app/api`) | API REST en el mismo proyecto |
| ORM | **Drizzle ORM** | Esquema tipado, migraciones, una sola fuente de verdad |
| Base de datos | **PostgreSQL 13+** | Esquema ya definido (`schema_en.sql`) |
| Agente | **Hermes Agent** (Nous Research) | API OpenAI-compatible en `localhost:8642` |
| MCP Server | **TypeScript** (`@modelcontextprotocol/sdk`) | Mismo codebase, transporte HTTP |
| Validación | **Zod** | Esquemas = validación + tipos derivados |
| Auth | **JWT en cookie httpOnly + bcrypt** | Mínima, suficiente para el MVP |
| Estado cliente | **TanStack Query** (opcional) | Para mutaciones y refresco de datos |

**Decisión clave:** el MCP server se escribe en TypeScript (no Python) para compartir el mismo Drizzle, la misma capa de servicios y el mismo lenguaje que el resto de la app. Un solo codebase → desarrollo con IA mucho más rápido.

---

## 3. Requerimientos funcionales

Organizados por módulo, siguiendo el árbol de navegación: **Auth → Organización → Empresas → {Ítems, Clima, Proyección, Alertas, Agente}**.

### Auth
- **RF1.1** Registro de usuario (email, contraseña, nombre).
- **RF1.2** Login con email + contraseña; sesión vía cookie httpOnly.
- **RF1.3** Logout.
- **RF1.4** Cada request autenticada resuelve el usuario y su `organization_id`.

### Organización
- **RF2.1** Al registrarse, el usuario crea una organización o se une a una existente.
- **RF2.2** Toda consulta de datos se filtra por `organization_id` (aislamiento multi-tenant).

### Empresas
- **RF3.1** Listar las empresas de la organización.
- **RF3.2** Crear una empresa (nombre, rubro, localidad, tarifas).
- **RF3.3** Seleccionar una empresa para trabajar (contexto activo).
- **RF3.4** Editar y eliminar empresa (cascada a sus datos).

### Ítems de consumo (equipment)
- **RF4.1** Listar equipos de la empresa con su consumo calculado.
- **RF4.2** Agregar equipo (nombre, vector gas/electricidad, potencia, horas/día, días/mes, etapa).
- **RF4.3** Editar y eliminar equipo.
- **RF4.4** Mostrar consumo estimado por equipo (potencia × horas × días).

### Dashboard de clima
- **RF5.1** Mostrar la serie de temperatura histórica de la localidad de la empresa (datos IPIEC).
- **RF5.2** Mostrar la temperatura prevista para el período en curso.
- **RF5.3** Visualizar la relación clima↔consumo (gráfico).

### Proyección de consumo
- **RF6.1** Calcular consumo y costo estimados según la temperatura prevista.
- **RF6.2** Guardar cada proyección (histórico navegable).
- **RF6.3** Mostrar la variación % respecto de un mes templado de referencia.

### Alertas
- **RF7.1** Generar una alerta cuando una proyección supera un umbral de variación.
- **RF7.2** Listar alertas de la empresa, con severidad y estado leído/no leído.
- **RF7.3** Marcar alerta como leída.

### Agente (conversación con Hermes)
- **RF8.1** Sección de chat por empresa; el usuario conversa con Hermes.
- **RF8.2** Persistir cada turno (usuario/asistente/tool) en la DB para mostrarlo.
- **RF8.3** Navegar conversaciones anteriores de la empresa.
- **RF8.4** Streaming de la respuesta del agente (SSE).
- **RF8.5** Lo que el usuario carga conversando aparece en las demás vistas (Hermes escribe vía MCP en la misma DB).

### Onboarding del gemelo digital (conversacional, por etapas)
- **RF9.1** Al crear una empresa vacía, se inicia un onboarding guiado por Hermes.
- **RF9.2** El agente avanza por etapas: `identity → equipment → operation → tariffs → complete`.
- **RF9.3** Cada etapa completada actualiza `onboarding_stage` y `profile_completion` (barra de progreso en vivo).
- **RF9.4** El onboarding cierra disparando la primera proyección + primera alerta (el "momento mágico").
- **RF9.5** Si el usuario vuelve, el agente retoma desde la etapa pendiente.

---

## 4. Requerimientos no funcionales

- **RNF1 — Seguridad del agente.** La API key de Hermes vive solo en el backend. El frontend nunca llama a Hermes directo (su endpoint da acceso a terminal).
- **RNF2 — Aislamiento.** Un usuario solo accede a datos de su organización.
- **RNF3 — Tiempo real.** El chat usa SSE para mostrar la respuesta token a token.
- **RNF4 — Despliegue local.** Para la demo, todo corre en una máquina: Next app + Postgres + MCP server + Hermes gateway.
- **RNF5 — Un solo codebase.** UI, REST y MCP comparten esquema Drizzle y capa de servicios.
- **RNF6 — Tipado de punta a punta.** Zod + tipos inferidos de Drizzle; sin `any`.

---

## 5. Arquitectura

### 5.1. Vista general (3 clientes, 1 fuente de verdad)

```
        Hermes (conversa)              Navegador / UI (visualiza)
              │                                  │
        MCP tools (HTTP)                   REST (fetch / SSE)
              │                                  │
   ┌──────────┼──────────────────────────────────┼──────────┐
   │   MCP Server (TS)                  Route Handlers (TS)   │
   │      tools.ts                         /app/api/*         │
   │          └──────────────┬──────────────────┘            │
   │                         ▼                                │
   │              Capa de SERVICIOS (TS)                      │
   │     company · equipment · projection · alert ·          │
   │     conversation · hermes · auth                        │
   │                         │                                │
   │                    Drizzle ORM                           │
   └─────────────────────────┼────────────────────────────────┘
                             ▼
                       PostgreSQL
```

La **capa de servicios** es el corazón: contiene toda la lógica de negocio. Tanto los Route Handlers (para la UI) como las tools del MCP (para Hermes) son envoltorios finos que llaman a esa capa. La lógica se escribe **una vez**.

### 5.2. Flujo de una conversación (UI → Hermes → MCP → DB)

```
1. UI → POST /api/companies/{id}/chat   (mensaje del usuario, con cookie)
2. Route handler:
     a. conversation.service → guarda mensaje (role=user)
     b. hermes.service → POST localhost:8642/v1/chat/completions
        (API key + conversation id para mantener el hilo)
3. Hermes razona → llama tool MCP: add_equipment(company_id, ...)
4. MCP tool → equipment.service.create(...) → INSERT en DB
5. Hermes redacta respuesta final → vuelve al route handler
6. Route handler:
     a. conversation.service → guarda mensaje (role=assistant)
     b. responde a la UI (SSE)
7. UI muestra la respuesta; la vista de Ítems ya tiene el equipo nuevo
```

---

## 6. Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                      # rutas protegidas
│   │   ├── layout.tsx              # sidebar + guard de sesión
│   │   ├── companies/
│   │   │   ├── page.tsx            # lista de empresas
│   │   │   └── [companyId]/
│   │   │       ├── page.tsx        # overview
│   │   │       ├── equipment/page.tsx
│   │   │       ├── climate/page.tsx
│   │   │       ├── projections/page.tsx
│   │   │       ├── alerts/page.tsx
│   │   │       └── agent/page.tsx  # chat con Hermes
│   │   └── ...
│   └── api/                        # API REST (Route Handlers)
│       ├── auth/[...]/route.ts
│       ├── companies/route.ts
│       ├── companies/[id]/route.ts
│       ├── companies/[id]/equipment/route.ts
│       ├── companies/[id]/projections/route.ts
│       ├── companies/[id]/alerts/route.ts
│       └── companies/[id]/chat/route.ts   # proxy a Hermes (SSE)
│
├── db/
│   ├── schema.ts                   # esquema Drizzle (espejo del DDL)
│   ├── index.ts                    # cliente drizzle
│   └── seed.ts                     # carga clima IPIEC + coeficientes
│
├── services/                       # ⭐ lógica de negocio (compartida)
│   ├── auth.service.ts
│   ├── company.service.ts
│   ├── equipment.service.ts
│   ├── projection.service.ts       # ⭐ el cálculo núcleo
│   ├── alert.service.ts
│   ├── conversation.service.ts
│   └── hermes.service.ts           # cliente del API de Hermes
│
├── mcp/
│   ├── server.ts                   # entrypoint MCP (Node, transporte HTTP)
│   └── tools.ts                    # tools que envuelven services
│
├── lib/
│   ├── auth.ts                     # JWT, hash, sesión
│   ├── validation.ts               # esquemas Zod
│   └── types.ts
│
└── components/
    ├── ui/                         # shadcn/ui
    ├── chat/                       # ventana de chat + barra de progreso
    └── charts/                     # gráficos clima/consumo
```

---

## 7. Responsabilidades por capa

| Capa | Responsabilidad | Regla |
|---|---|---|
| **Route Handlers** | Auth, validación (Zod), llamar a un service, responder | Finos. Sin lógica de negocio ni SQL. |
| **MCP tools** | Validar input, llamar al mismo service, devolver texto a Hermes | Finos. Espejo de los handlers. |
| **Services** | Toda la lógica de negocio y acceso a DB vía Drizzle | Únicos que tocan la DB. Reutilizables. |
| **Server Components** | Leer datos para render (llaman services directo, sin HTTP) | Solo lectura. |
| **Client Components** | Interacción, formularios, chat con SSE | Mutaciones vía `/api`. |

---

## 8. Contrato de la API REST

Todas requieren sesión válida y filtran por `organization_id`.

| Método | Ruta | Acción |
|---|---|---|
| POST | `/api/auth/register` | Crear usuario + organización |
| POST | `/api/auth/login` | Iniciar sesión (set cookie) |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/companies` | Listar empresas |
| POST | `/api/companies` | Crear empresa |
| GET | `/api/companies/{id}` | Detalle de empresa |
| PATCH | `/api/companies/{id}` | Editar empresa |
| DELETE | `/api/companies/{id}` | Eliminar empresa |
| GET | `/api/companies/{id}/equipment` | Listar equipos |
| POST | `/api/companies/{id}/equipment` | Agregar equipo |
| PATCH | `/api/equipment/{id}` | Editar equipo |
| DELETE | `/api/equipment/{id}` | Eliminar equipo |
| GET | `/api/companies/{id}/climate` | Serie de clima de la localidad |
| POST | `/api/companies/{id}/projections` | Generar proyección (input: temp prevista) |
| GET | `/api/companies/{id}/projections` | Histórico de proyecciones |
| GET | `/api/companies/{id}/alerts` | Listar alertas |
| PATCH | `/api/alerts/{id}` | Marcar leída |
| GET | `/api/companies/{id}/conversations` | Listar conversaciones |
| GET | `/api/conversations/{id}/messages` | Mensajes de una conversación |
| POST | `/api/companies/{id}/chat` | Enviar mensaje → Hermes (SSE) |

---

## 9. Contrato de las tools MCP

Expuestas a Hermes vía HTTP. Cada una es un envoltorio fino sobre un service. Se filtran con `include` en la config de Hermes (candado de seguridad).

| Tool | Parámetros | Service que llama |
|---|---|---|
| `create_company` | org_id, name, industry, location, tariffs | company.create |
| `update_company` | company_id, campos | company.update |
| `add_equipment` | company_id, name, vector, power, hours, days | equipment.create |
| `list_equipment` | company_id | equipment.listByCompany |
| `project_consumption` | company_id, forecast_temp | projection.compute |
| `profile_status` | company_id | company.getProfileStatus |

Config en `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  optimizer:
    url: "http://localhost:8000/mcp"
    tools:
      include: [create_company, update_company, add_equipment,
                list_equipment, project_consumption, profile_status]
```

---

## 10. Integración con Hermes (`hermes.service.ts`)

Hermes expone un API OpenAI-compatible. El backend lo llama así:

```
POST http://localhost:8642/v1/chat/completions
Authorization: Bearer ${HERMES_API_KEY}
{
  "model": "hermes-agent",
  "messages": [ { "role": "system", "content": ONBOARDING_PROMPT },
                { "role": "user",   "content": userMessage } ],
  "conversation": "company-{id}",   // mantiene el hilo del lado de Hermes
  "stream": true
}
```

- **System prompt:** Hermes lo *suma* a su prompt base (no lo reemplaza). Ahí se define el rol de onboarding por etapas.
- **Hilo de conversación:** usar el parámetro `conversation` con un nombre derivado de la empresa. Hermes encadena los turnos solo. Guardar el id devuelto en `conversation.hermes_session_id`.
- **Streaming:** SSE estándar (`chat.completion.chunk`) + evento `hermes.tool.progress` para mostrar "el agente está guardando...". El backend reenvía el stream a la UI.
- **Seguridad:** la API key solo en el backend. El front nunca toca `localhost:8642`.

---

## 11. Lógica de proyección (`projection.service.ts`)

El núcleo del sistema. Pseudocódigo:

```
function computeProjection(companyId, forecastTemp):
    company   = company.get(companyId)
    equipment = equipment.listByCompany(companyId)
    coeffs    = modelCoefficient.all()   // { gas, electricity }

    totalConsumption = 0
    totalCost        = 0

    for vector in [gas, electricity]:
        items = equipment.filter(e => e.vector == vector)
        baseConsumption = sum(e.power * e.hours_per_day * e.days_per_month for e in items)

        c = coeffs[vector]
        // el consumo sube cuando la temp baja respecto de la referencia
        factor = 1 + c.sensitivity_per_degree * (c.reference_temp - forecastTemp)
        adjusted = baseConsumption * factor

        tariff = vector == gas ? company.gas_tariff : company.electricity_tariff
        totalConsumption += adjusted
        totalCost        += adjusted * (tariff ?? 0)

    // variación vs. un mes templado (factor = 1)
    baseTotal = sum over vectors of baseConsumption
    variationPct = (totalConsumption - baseTotal) / baseTotal * 100

    projection = projection.insert({ companyId, forecastTemp,
        estimated_consumption: totalConsumption,
        estimated_cost: totalCost, variation_pct: variationPct })

    if variationPct > THRESHOLD:   // ej. 15%
        alert.create(companyId, projection.id, 'consumption_spike',
            severity_from(variationPct), buildMessage(...))

    return projection
```

Coeficientes ya cargados (seed): gas `sensitivity_per_degree = 0.043` (R²=0,90), electricidad `0.010` (R²=0,13), `reference_temp = 10°C` (ajustable).

---

## 12. Onboarding por etapas — mapeo a datos

| Etapa | Pregunta de Hermes | Tool MCP | `profile_completion` |
|---|---|---|---|
| identity | Nombre, rubro, localidad | create_company | 20% |
| equipment | Equipos (uno por uno) | add_equipment | 50% |
| operation | Horarios, turnos, flujo | update_company | 70% |
| tariffs | Tarifa gas y electricidad | update_company | 90% |
| complete | (dispara proyección) | project_consumption | 100% |

El `system prompt` de onboarding instruye a Hermes: una pregunta por turno, no avanzar de etapa sin completar la actual, y al llegar a `complete` llamar `project_consumption` y mostrar la primera predicción.

---

## 13. Convenciones para desarrollo con IA

Reglas que mantienen el código predecible y permiten que la IA genere piezas consistentes:

- **Zod primero.** Cada entidad tiene su esquema Zod en `lib/validation.ts`; los tipos se derivan de ahí (`z.infer`). Sin tipos duplicados a mano.
- **Drizzle como verdad del esquema.** Los tipos de fila se infieren de `db/schema.ts` (`InferSelectModel`). El esquema espeja el DDL ya validado.
- **Handlers y tools finos.** Nunca SQL ni lógica en un route handler o una tool: siempre delegan a un service.
- **Services puros y tipados.** Reciben params, devuelven datos tipados, lanzan errores conocidos. Son el único lugar con Drizzle.
- **Nombres en inglés**, snake_case en DB / camelCase en TS (Drizzle mapea).
- **Un service por entidad.** Si una función toca dos entidades, vive en el service de la entidad "dueña" del flujo.
- **Errores tipados.** `AppError` con código y status; el handler los traduce a HTTP.

---

## 14. Orden de construcción (prioridad para el hackathon)

Construir en este orden maximiza lo demostrable lo antes posible:

1. **Base.** Proyecto Next + Drizzle conectado a Postgres; `db/schema.ts` espejando el DDL; `seed.ts` cargando clima + coeficientes.
2. **Núcleo de valor.** `projection.service.ts` + endpoint de proyección. Probarlo con datos demo: ya tenés el cálculo clima→consumo funcionando (esto es lo que gana).
3. **CRUD mínimo.** `company` y `equipment` (services + handlers + vistas básicas). Vista de ítems con consumo calculado.
4. **Clima + alertas.** Dashboard de clima (gráfico) y listado de alertas leyendo de la DB.
5. **MCP server.** `mcp/server.ts` + `tools.ts` envolviendo los services. Conectar a Hermes y probar `add_equipment` desde el chat.
6. **Chat + onboarding.** `hermes.service.ts`, endpoint `/chat` con SSE, ventana de chat con barra de progreso. Afinar el system prompt de onboarding.
7. **Auth.** Login/registro mínimo. Hacerlo al final: es lo que menos evalúa el jurado.
8. **Pulido demo.** Datos demo a medio onboarding (50%) para arrancar la presentación sin signup en vivo.

> Si el tiempo aprieta: los pasos 1, 2, 5 y 6 son el corazón demostrable. El resto es soporte.

---

## 15. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Hermes no responde el día del evento | Probar el gateway + provider de modelo **temprano**; tener un mock del `hermes.service` como respaldo |
| El agente divaga en el onboarding | System prompt estricto: "una pregunta por turno, no avances sin completar la etapa" |
| El front llama a Hermes directo (inseguro) | Solo el backend tiene la API key; CORS de Hermes cerrado |
| Coeficiente provincial usado a escala empresa | Es un proxy defendible para el MVP; aclararlo si el jurado pregunta |
| Auth consume demasiado tiempo | Auth mínima (JWT + bcrypt), sin recuperación de contraseña ni verificación de email |

---

*Esquema de base de datos: ver `schema_en.sql` (10 tablas, validado en PostgreSQL).*
