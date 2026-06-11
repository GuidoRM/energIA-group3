import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env, isProduction } from "@/config/env";
import * as schema from "./schema";

/**
 * Drizzle database client (postgres.js driver).
 *
 * The underlying connection is cached on `globalThis` in development so that
 * Next.js hot-reloads don't open a new pool on every change.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ??
  postgres(env.DATABASE_URL, {
    max: isProduction ? 10 : 1,
  });

if (!isProduction) globalForDb.client = client;

export const db = drizzle(client, { schema, casing: "snake_case" });

export { schema };
export type Database = typeof db;
