import { z } from "zod";

/**
 * Zod primero (§13): cada entidad define su esquema acá y los tipos se
 * derivan con `z.infer`. Estos esquemas validan el input de los route
 * handlers y de las tools MCP.
 */

// ── Enums (espejo de src/db/schema/enums.ts) ──────────────────────────────
export const tdfLocationSchema = z.enum(["ushuaia", "rio_grande", "tolhuin"]);
export const energyVectorSchema = z.enum(["gas", "electricity"]);
export const onboardingStageSchema = z.enum([
  "identity",
  "equipment",
  "operation",
  "tariffs",
  "complete",
]);

// ── Auth ──────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1),
  // Crea una organización nueva con este nombre, o se une a una existente por id.
  organizationName: z.string().min(1).optional(),
  organizationId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Company ────────────────────────────────────────────────────────────────
export const createCompanySchema = z.object({
  name: z.string().min(1),
  industry: z.string().min(1).optional(),
  location: tdfLocationSchema.default("rio_grande"),
  gasTariff: z.number().nonnegative().optional(),
  electricityTariff: z.number().nonnegative().optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  industry: z.string().min(1).nullable().optional(),
  location: tdfLocationSchema.optional(),
  gasTariff: z.number().nonnegative().nullable().optional(),
  electricityTariff: z.number().nonnegative().nullable().optional(),
  onboardingStage: onboardingStageSchema.optional(),
  profileCompletion: z.number().int().min(0).max(100).optional(),
});

// ── Equipment ────────────────────────────────────────────────────────────
export const createEquipmentSchema = z.object({
  name: z.string().min(1),
  vector: energyVectorSchema,
  power: z.number().positive("La potencia debe ser mayor a 0"),
  hoursPerDay: z.number().min(0).max(24).default(0),
  daysPerMonth: z.number().int().min(0).max(31).default(0),
  processStage: z.string().min(1).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();

// ── Projection ──────────────────────────────────────────────────────────────
export const createProjectionSchema = z.object({
  // Si se omite, el handler usa el promedio histórico del mes (RF5.2).
  forecastTemp: z.number().min(-50).max(60).optional(),
  year: z.number().int().min(1990).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

// ── Alert ────────────────────────────────────────────────────────────────
export const updateAlertSchema = z.object({
  isRead: z.boolean(),
});

// ── Chat ──────────────────────────────────────────────────────────────────
export const chatMessageSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
});

// ── Tipos derivados ──────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type CreateProjectionInput = z.infer<typeof createProjectionSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
