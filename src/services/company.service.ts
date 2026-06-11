import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { company } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { Company } from "@/lib/types";
import type { CreateCompanyInput, UpdateCompanyInput } from "@/lib/validation";
import { onboardingService } from "./onboarding.service";

/**
 * company.service — único lugar que lee/escribe la tabla `company`.
 * Centraliza el aislamiento multi-tenant (RNF2): las lecturas se filtran por
 * `organization_id`.
 */

function numericOrNull(value: number | null | undefined): string | null {
  return value === null || value === undefined ? null : String(value);
}

export const companyService = {
  /** RF3.1 — empresas de la organización. */
  listByOrg(organizationId: string): Promise<Company[]> {
    return db.query.company.findMany({
      where: eq(company.organizationId, organizationId),
      orderBy: desc(company.createdAt),
    });
  },

  /** Lectura cruda por id (sin filtro de organización). Uso interno / MCP. */
  getById(companyId: string): Promise<Company | undefined> {
    return db.query.company.findFirst({ where: eq(company.id, companyId) });
  },

  /** RF3.x — empresa garantizando que pertenece a la organización (aislamiento). */
  async getForOrg(companyId: string, organizationId: string): Promise<Company> {
    const row = await db.query.company.findFirst({
      where: and(
        eq(company.id, companyId),
        eq(company.organizationId, organizationId),
      ),
    });
    if (!row) throw AppError.notFound("Empresa no encontrada");
    return row;
  },

  /** RF3.2 — crear empresa. */
  async create(
    organizationId: string,
    input: CreateCompanyInput,
  ): Promise<Company> {
    const [row] = await db
      .insert(company)
      .values({
        organizationId,
        name: input.name,
        industry: input.industry,
        location: input.location,
        gasTariff: numericOrNull(input.gasTariff),
        electricityTariff: numericOrNull(input.electricityTariff),
        profileCompletion: 20, // identity stage desde la creación
      })
      .returning();
    return row!;
  },

  /** RF3.4 — editar empresa. */
  async update(companyId: string, input: UpdateCompanyInput): Promise<Company> {
    const [row] = await db
      .update(company)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.industry !== undefined && { industry: input.industry }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.gasTariff !== undefined && {
          gasTariff: numericOrNull(input.gasTariff),
        }),
        ...(input.electricityTariff !== undefined && {
          electricityTariff: numericOrNull(input.electricityTariff),
        }),
        ...(input.onboardingStage !== undefined && {
          onboardingStage: input.onboardingStage,
        }),
        ...(input.profileCompletion !== undefined && {
          profileCompletion: input.profileCompletion,
        }),
      })
      .where(eq(company.id, companyId))
      .returning();
    if (!row) throw AppError.notFound("Empresa no encontrada");
    // Re-sync solo si el agente no forzó valores de onboarding manualmente.
    const agentForcedStage =
      input.onboardingStage !== undefined ||
      input.profileCompletion !== undefined;
    if (!agentForcedStage) {
      await onboardingService.syncStage(companyId).catch(() => {});
    }
    return row;
  },

  /** RF3.4 — eliminar (cascada a sus datos vía FKs ON DELETE CASCADE). */
  async remove(companyId: string): Promise<void> {
    await db.delete(company).where(eq(company.id, companyId));
  },

  /** Estado de onboarding (tool MCP profile_status). */
  async getProfileStatus(companyId: string) {
    const row = await this.getById(companyId);
    if (!row) throw AppError.notFound("Empresa no encontrada");
    return {
      companyId: row.id,
      name: row.name,
      onboardingStage: row.onboardingStage,
      profileCompletion: row.profileCompletion,
      hasTariffs: row.gasTariff !== null || row.electricityTariff !== null,
    };
  },
};
