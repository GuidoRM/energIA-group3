import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projection } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { Projection } from "@/lib/types";
import { alertService, severityFromVariation } from "./alert.service";
import { climateService } from "./climate.service";
import { companyService } from "./company.service";
import { equipmentService, monthlyConsumption } from "./equipment.service";
import { onboardingService } from "./onboarding.service";

/**
 * projection.service — el núcleo del sistema (§11).
 *
 * Modelo clima→consumo, por vector energético:
 *   factor   = 1 + sensitivity_per_degree * (reference_temp - forecastTemp)
 *   ajustado = consumo_base * factor
 * El consumo sube cuando la temperatura baja respecto de la referencia.
 */

/** Umbral de variación (%) que dispara una alerta (RF7.1). */
const ALERT_THRESHOLD_PCT = 15;

type Vector = "gas" | "electricity";

export interface ProjectionBreakdown {
  vector: Vector;
  baseConsumption: number;
  adjustedConsumption: number;
  cost: number;
  tariff: number;
}

export interface ProjectionResult {
  projection: Projection;
  breakdown: ProjectionBreakdown[];
}

function toMoney(n: number): string {
  return n.toFixed(2);
}

export const projectionService = {
  /** RF6.2 — histórico de proyecciones de la empresa. */
  listByCompany(companyId: string): Promise<Projection[]> {
    return db.query.projection.findMany({
      where: eq(projection.companyId, companyId),
      orderBy: desc(projection.createdAt),
    });
  },

  /**
   * RF6.1/RF6.3 — calcula consumo y costo según la temperatura prevista,
   * guarda la proyección y, si supera el umbral, dispara una alerta.
   */
  async compute(
    companyId: string,
    args: { forecastTemp: number; year?: number; month?: number },
  ): Promise<ProjectionResult> {
    const company = await companyService.getById(companyId);
    if (!company) throw AppError.notFound("Empresa no encontrada");

    const items = await equipmentService.listByCompany(companyId);
    const coeffs = await climateService.getCoefficients();

    const tariffByVector: Record<Vector, number> = {
      gas: Number(company.gasTariff ?? 0),
      electricity: Number(company.electricityTariff ?? 0),
    };

    let totalConsumption = 0;
    let totalBase = 0;
    let totalCost = 0;
    const breakdown: ProjectionBreakdown[] = [];

    for (const vector of ["gas", "electricity"] as const) {
      const vectorItems = items.filter((e) => e.vector === vector);
      const baseConsumption = vectorItems.reduce(
        (sum, e) => sum + monthlyConsumption(e),
        0,
      );

      const c = coeffs[vector];
      const factor =
        1 +
        Number(c.sensitivityPerDegree) *
          (Number(c.referenceTemp) - args.forecastTemp);
      const adjusted = baseConsumption * factor;
      const tariff = tariffByVector[vector];

      totalBase += baseConsumption;
      totalConsumption += adjusted;
      totalCost += adjusted * tariff;

      breakdown.push({
        vector,
        baseConsumption,
        adjustedConsumption: adjusted,
        cost: adjusted * tariff,
        tariff,
      });
    }

    // Variación vs. un mes templado de referencia (factor = 1 → consumo base).
    const variationPct =
      totalBase > 0 ? ((totalConsumption - totalBase) / totalBase) * 100 : 0;

    const now = new Date();
    const year = args.year ?? now.getFullYear();
    const month = args.month ?? now.getMonth() + 1;

    const [row] = await db
      .insert(projection)
      .values({
        companyId,
        year,
        month,
        forecastTemp: toMoney(args.forecastTemp),
        estimatedConsumption: toMoney(totalConsumption),
        estimatedCost: toMoney(totalCost),
        variationPct: toMoney(variationPct),
      })
      .returning();

    const saved = row!;

    // RF7.1 — alerta si la variación supera el umbral.
    if (Math.abs(variationPct) > ALERT_THRESHOLD_PCT) {
      await alertService.create({
        companyId,
        projectionId: saved.id,
        type: variationPct > 0 ? "consumption_spike" : "anomaly",
        severity: severityFromVariation(variationPct),
        message: buildAlertMessage(variationPct, totalCost, args.forecastTemp),
      });
    }

    await onboardingService.syncStage(companyId).catch(() => {});

    return { projection: saved, breakdown };
  },
};

function buildAlertMessage(
  variationPct: number,
  totalCost: number,
  forecastTemp: number,
): string {
  const dir = variationPct > 0 ? "aumento" : "descenso";
  return (
    `Proyección con ${dir} del ${Math.abs(variationPct).toFixed(1)}% en el ` +
    `consumo para una temperatura prevista de ${forecastTemp}°C. ` +
    `Costo estimado: $${totalCost.toFixed(2)}.`
  );
}
