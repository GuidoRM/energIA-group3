import type { InferSelectModel } from "drizzle-orm";

import type {
  alert,
  appUser,
  company,
  conversation,
  equipment,
  message,
  modelCoefficient,
  monthlyClimate,
  organization,
  projection,
} from "@/db/schema";

/**
 * Tipos de fila inferidos de Drizzle (§13: el esquema es la fuente de verdad).
 * No se escriben tipos de entidad a mano.
 */
export type Organization = InferSelectModel<typeof organization>;
export type AppUser = InferSelectModel<typeof appUser>;
export type Company = InferSelectModel<typeof company>;
export type Equipment = InferSelectModel<typeof equipment>;
export type MonthlyClimate = InferSelectModel<typeof monthlyClimate>;
export type ModelCoefficient = InferSelectModel<typeof modelCoefficient>;
export type Projection = InferSelectModel<typeof projection>;
export type Alert = InferSelectModel<typeof alert>;
export type Conversation = InferSelectModel<typeof conversation>;
export type Message = InferSelectModel<typeof message>;

/** Identidad resuelta desde la cookie de sesión. */
export interface SessionUser {
  userId: string;
  organizationId: string;
  email: string;
  name: string;
  role: "admin" | "member";
}

/** Equipo con su consumo base mensual ya calculado (RF4.4). */
export interface EquipmentWithConsumption extends Equipment {
  /** kWh (electricidad) o m³ (gas) por mes, en condiciones de referencia. */
  monthlyConsumption: number;
}
