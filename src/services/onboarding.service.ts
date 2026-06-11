import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { company, equipment, projection } from "@/db/schema";

type Stage = "identity" | "equipment" | "operation" | "tariffs" | "complete";

function computeStage(
  equipmentCount: number,
  operationalCount: number,
  hasTariffs: boolean,
  projectionCount: number,
): { stage: Stage; pct: number } {
  if (projectionCount > 0 && hasTariffs) return { stage: "complete", pct: 100 };
  if (hasTariffs) return { stage: "tariffs", pct: 80 };
  if (operationalCount > 0) return { stage: "operation", pct: 60 };
  if (equipmentCount > 0) return { stage: "equipment", pct: 40 };
  return { stage: "identity", pct: 20 };
}

/**
 * Calcula y persiste el stage/% del gemelo digital en función del estado real
 * de la DB. Se llama como side-effect de operaciones que modifican el estado
 * relevante (crear equipo, actualizar tarifas, generar proyección).
 */
export const onboardingService = {
  async syncStage(companyId: string): Promise<void> {
    const comp = await db.query.company.findFirst({
      where: eq(company.id, companyId),
    });
    if (!comp) return;

    const eqCount = await db.$count(
      equipment,
      eq(equipment.companyId, companyId),
    );

    const opCount = await db.$count(
      equipment,
      and(
        eq(equipment.companyId, companyId),
        gt(equipment.hoursPerDay, "0"),
        gt(equipment.daysPerMonth, 0),
      ),
    );

    const prjCount = await db.$count(
      projection,
      eq(projection.companyId, companyId),
    );

    const hasTariffs =
      comp.gasTariff !== null && comp.electricityTariff !== null;

    const { stage, pct } = computeStage(
      Number(eqCount),
      Number(opCount),
      hasTariffs,
      Number(prjCount),
    );

    if (comp.onboardingStage !== stage || comp.profileCompletion !== pct) {
      await db
        .update(company)
        .set({ onboardingStage: stage, profileCompletion: pct })
        .where(eq(company.id, companyId));
    }
  },
};
