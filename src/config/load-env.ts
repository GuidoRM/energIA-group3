/**
 * Carga `.env.local` para procesos que corren FUERA de Next.js (seed, MCP
 * server), donde Next no inyecta las variables automáticamente.
 *
 * Debe importarse PRIMERO, antes que cualquier módulo que lea `@/config/env`.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
