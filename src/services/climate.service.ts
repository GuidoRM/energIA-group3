import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { modelCoefficient, monthlyClimate } from "@/db/schema";
import { AppError } from "@/lib/errors";
import type { ModelCoefficient, MonthlyClimate } from "@/lib/types";

/**
 * climate.service — series climáticas IPIEC (`monthly_climate`) y coeficientes
 * del modelo (`model_coefficient`). Datos de referencia [SEED].
 */

export type CoefficientMap = Record<"gas" | "electricity", ModelCoefficient>;

export const climateService = {
  /** RF5.1 — serie histórica de temperatura de una localidad. */
  getSeries(location: MonthlyClimate["location"]): Promise<MonthlyClimate[]> {
    return db.query.monthlyClimate.findMany({
      where: eq(monthlyClimate.location, location),
      orderBy: [asc(monthlyClimate.year), asc(monthlyClimate.month)],
    });
  },

  /**
   * RF5.2 — temperatura prevista para un mes: promedio histórico de ese mes
   * en la localidad (proxy simple y defendible para el MVP).
   */
  async forecastTempFor(
    location: MonthlyClimate["location"],
    month: number,
  ): Promise<number | null> {
    const rows = await db.query.monthlyClimate.findMany({
      where: and(
        eq(monthlyClimate.location, location),
        eq(monthlyClimate.month, month),
      ),
    });
    if (rows.length === 0) return null;
    const avg =
      rows.reduce((sum, r) => sum + Number(r.meanTemp), 0) / rows.length;
    return Math.round(avg * 100) / 100;
  },

  /** Coeficientes clima→consumo, indexados por vector. */
  async getCoefficients(): Promise<CoefficientMap> {
    const rows = await db.query.modelCoefficient.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.vector, r])) as Partial<
      Record<"gas" | "electricity", ModelCoefficient>
    >;
    if (!map.gas || !map.electricity) {
      throw AppError.badRequest(
        "Faltan coeficientes del modelo. Corré `npm run db:seed`.",
      );
    }
    return { gas: map.gas, electricity: map.electricity };
  },
};
