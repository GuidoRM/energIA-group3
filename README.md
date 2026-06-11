# Energy Optimizer · Patagonian SMEs

Asistente optimizador de recursos energéticos para PyMEs fueguinas
(IATHON 2026). Construye un **gemelo digital** de cada PyME y **predice consumo
y costo energético a partir del clima** (la temperatura explica ~90% de la
variación del consumo de gas, r = -0,95).

Tres caras sobre **una sola base de datos**: UI web, API REST y servidor MCP
(que consume el agente Hermes). Ver [`documentation/ESPECIFICACIONES.md`](documentation/ESPECIFICACIONES.md).

## Stack

| Capa      | Tecnología                                            |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript       |
| Estilos   | Tailwind CSS 4 (CSS-first, design tokens) · estilo shadcn |
| Backend   | Route Handlers (`/app/api`) + capa de servicios       |
| ORM / DB  | Drizzle ORM + `postgres.js` sobre PostgreSQL 13+      |
| Agente    | Hermes (API OpenAI-compatible) vía MCP (TypeScript)   |
| Auth      | JWT en cookie httpOnly + bcrypt                       |
| Validación| Zod (esquemas = validación + tipos)                   |
| Gráficos  | Recharts                                              |

## Arquitectura (§5)

La **capa de servicios** (`src/services`) es el corazón: contiene toda la
lógica de negocio y es la única que toca Drizzle. Los Route Handlers (para la
UI) y las tools MCP (para Hermes) son envoltorios finos sobre esa capa. La
lógica se escribe **una sola vez**.

```
 Hermes ──MCP(HTTP)──┐         ┌──REST/SSE── Navegador
                     ▼         ▼
              src/mcp/tools   src/app/api      ← envoltorios finos
                     └────┬────┘
                          ▼
                  src/services/*               ← lógica de negocio (única DB)
                          ▼
                   Drizzle ORM → PostgreSQL
```

## Estructura

```
src/
├── app/
│   ├── (auth)/{login,register}/        # páginas públicas
│   ├── (app)/                          # rutas protegidas (guard de sesión)
│   │   └── companies/[companyId]/      # resumen · equipos · clima · proyecciones · alertas · agente
│   └── api/                            # API REST (contrato §8) + chat SSE
├── db/
│   ├── schema/                         # esquema Drizzle (espejo del DDL), por dominio
│   ├── index.ts                        # cliente Drizzle
│   └── seed.ts                         # coeficientes + serie de clima IPIEC
├── services/                           # ⭐ company · equipment · projection · alert · climate · conversation · hermes · auth
├── mcp/                                # server.ts (HTTP) + tools.ts (§9)
├── lib/                                # auth · validation (Zod) · errors · guards · api · client · format · types
├── config/                             # env (Zod) · load-env
└── components/                         # ui (shadcn) · charts · chat · companies · equipment · alerts · auth
```

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Postgres (docker) + entorno
docker compose up -d
cp .env.example .env.local          # editá DATABASE_URL / JWT_SECRET si hace falta

# 3. Esquema + datos de referencia
npm run db:push                     # crea las tablas (o db:generate + db:migrate)
npm run db:seed                     # coeficientes del modelo + clima IPIEC

# 4. Agente Hermes — proxy OpenAI-compatible (en otra terminal)
hermes proxy start --port 8645      # http://127.0.0.1:8645/v1

# 5. App
npm run dev                         # http://localhost:3000
```

### Integración con Hermes (Opción A: el backend orquesta)

El chat (`/api/companies/{id}/chat`) habla con el **proxy** de Hermes
(`hermes proxy start`, OpenAI-compatible en `:8645`). El backend le pasa al
modelo el system prompt de onboarding + las tools; cuando el modelo pide un
`tool_call`, **el backend lo ejecuta** vía los services —con el `companyId`
forzado server-side (RNF2)— y realimenta el resultado hasta la respuesta
final, que se streamea a la UI (`src/services/hermes.service.ts` +
`agent-tools.ts`). Así, lo que el usuario carga conversando aparece en las
demás vistas (RF8.5). La API key vive **solo** en el backend (RNF1).

- **Modelo:** `HERMES_MODEL` (default `stepfun/step-3.7-flash:free`, gratis y
  con function-calling). `nousresearch/hermes-4-70b/405b` requieren créditos en
  [portal.nousresearch.com](https://portal.nousresearch.com).
  Listar: `curl -s http://127.0.0.1:8645/v1/models -H "Authorization: Bearer x"`.
- **Sin proxy:** poné `HERMES_MOCK="true"` para un stream simulado (el chat
  conversa pero no escribe en la DB).

> **Hermes como agente autónomo (Opción B, alternativa):** registrar el MCP
> server propio en Hermes con `hermes mcp add optimizer --url
> http://localhost:8000/mcp` (`npm run mcp`) y conducir el agente desde su
> CLI/gateway. Útil para usar la memoria/persona de Hermes; no necesario para
> el chat de la UI.

## Scripts

| Comando               | Descripción                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Servidor de desarrollo                   |
| `npm run build`       | Build de producción                      |
| `npm run lint`        | ESLint                                   |
| `npm run typecheck`   | `tsc --noEmit`                           |
| `npm run db:push`     | Sincronizar el esquema sin migraciones   |
| `npm run db:generate` | Generar migraciones SQL                  |
| `npm run db:migrate`  | Aplicar migraciones                      |
| `npm run db:seed`     | Cargar coeficientes + clima              |
| `npm run db:studio`   | Drizzle Studio                           |
| `npm run mcp`         | Servidor MCP (Hermes)                    |

## Estado de implementación

Implementado siguiendo el orden de prioridad de la §14:

- ✅ Base: esquema Drizzle (10 tablas, espejo del DDL) + seed (coeficientes + clima).
- ✅ Núcleo: `projection.service` (modelo clima→consumo, §11) + alertas por umbral.
- ✅ CRUD: company y equipment (services + API + vistas con consumo calculado).
- ✅ Clima + alertas: dashboard con gráfico y listado leído/no leído.
- ✅ MCP server + 6 tools envolviendo los services (§9).
- ✅ Chat + onboarding: `hermes.service` (con mock), endpoint `/chat` con SSE,
  ventana de chat y barra de progreso de perfil.
- ✅ Auth: registro/login (JWT + bcrypt) y aislamiento multi-tenant.

Pendiente / siguiente: afinar el `system prompt` de onboarding contra Hermes
real, edición inline de empresa/equipo en la UI, y datos demo a 50% (§14.8).
