import { z } from "zod";

/**
 * Centralized, type-safe environment configuration.
 * Validated once at import time so misconfiguration fails fast.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection string"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Auth — secret used to sign session JWTs (min 32 chars).
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .default("dev-only-insecure-secret-change-me-in-production"),

  // Hermes agent (OpenAI-compatible gateway). Key lives ONLY on the backend.
  HERMES_API_URL: z.string().url().default("http://localhost:8642/v1"),
  HERMES_API_KEY: z.string().default(""),
  HERMES_MODEL: z.string().default("hermes-agent"),
  // When Hermes isn't running, the service falls back to a deterministic mock.
  HERMES_MOCK: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),

  // Port the standalone MCP HTTP server listens on.
  MCP_PORT: z.coerce.number().int().positive().default(8000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.treeifyError(parsed.error),
  );
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
