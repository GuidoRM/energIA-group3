# Energy Optimizer · Patagonian SMEs

Proyecciones de consumo energético sensibles al clima para PyMEs de Tierra del
Fuego (IATHON 2026). Construido con **Next.js + TypeScript + Drizzle ORM
(PostgreSQL) + Tailwind 4**.

## Stack

| Capa      | Tecnología                                         |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript    |
| Estilos   | Tailwind CSS 4 (CSS-first, design tokens en OKLCH) |
| ORM / DB  | Drizzle ORM + `postgres.js` sobre PostgreSQL 13+   |
| Entorno   | Validación de variables con Zod                    |

## Estructura

```
src/
├── app/                      # FRONTEND — App Router
│   ├── layout.tsx            # layout raíz + fuentes
│   ├── page.tsx              # landing
│   ├── globals.css           # Tailwind 4 + design tokens (variables CSS)
│   └── api/                  # capa HTTP del backend (route handlers)
│       └── health/route.ts   # GET /api/health
├── components/ui/            # componentes de UI reutilizables
├── lib/                      # utilidades compartidas (cn, ...)
├── config/
│   └── env.ts                # configuración de entorno validada (Zod)
└── server/                   # BACKEND
    ├── db/
    │   ├── index.ts          # cliente Drizzle (pool cacheado)
    │   ├── seed.ts           # datos de referencia [SEED]
    │   └── schema/           # schema Drizzle dividido por dominio
    │       ├── enums.ts
    │       ├── organization.ts
    │       ├── user.ts
    │       ├── company.ts
    │       ├── equipment.ts
    │       ├── climate.ts
    │       ├── projection.ts
    │       ├── alert.ts
    │       ├── conversation.ts
    │       └── index.ts      # barrel
    ├── repositories/         # acceso a datos (Drizzle vive solo aquí)
    └── services/             # lógica de negocio agnóstica del framework
```

El schema de Drizzle es la traducción 1:1 de `schema_en.sql`.

## Puesta en marcha

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Configurar el entorno** — copiar y editar `DATABASE_URL`:

   ```bash
   cp .env.example .env.local
   ```

3. **Crear las tablas** (elegí una):

   ```bash
   npm run db:push        # empuja el schema directo (ideal en desarrollo)
   # o, con migraciones versionadas:
   npm run db:generate    # genera SQL en ./drizzle
   npm run db:migrate
   ```

4. **Cargar datos de referencia**

   ```bash
   npm run db:seed
   ```

5. **Desarrollo**

   ```bash
   npm run dev            # http://localhost:3000
   ```

## Scripts

| Comando               | Descripción                             |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Servidor de desarrollo                  |
| `npm run build`       | Build de producción                     |
| `npm run start`       | Servir el build                         |
| `npm run lint`        | ESLint                                  |
| `npm run typecheck`   | `tsc --noEmit`                          |
| `npm run db:generate` | Generar migraciones SQL desde el schema |
| `npm run db:migrate`  | Aplicar migraciones pendientes          |
| `npm run db:push`     | Sincronizar el schema sin migraciones   |
| `npm run db:studio`   | Drizzle Studio (explorador de la DB)    |
| `npm run db:seed`     | Cargar datos de referencia              |
