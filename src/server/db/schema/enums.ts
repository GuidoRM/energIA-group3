import { pgEnum } from "drizzle-orm/pg-core";

/**
 * PostgreSQL ENUM types.
 * Mirrors the `CREATE TYPE ... AS ENUM` definitions in schema_en.sql.
 */

export const tdfLocation = pgEnum("tdf_location", [
  "ushuaia",
  "rio_grande",
  "tolhuin",
]);

export const energyVector = pgEnum("energy_vector", ["gas", "electricity"]);

export const userRole = pgEnum("user_role", ["admin", "member"]);

export const onboardingStage = pgEnum("onboarding_stage", [
  "identity",
  "equipment",
  "operation",
  "tariffs",
  "complete",
]);

export const messageRole = pgEnum("message_role", ["user", "assistant", "tool"]);

export const alertSeverity = pgEnum("alert_severity", ["low", "medium", "high"]);

export const alertType = pgEnum("alert_type", [
  "consumption_spike",
  "cost_spike",
  "anomaly",
]);
