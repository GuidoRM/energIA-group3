import { ok, parseJson, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { createProjectionSchema } from "@/lib/validation";
import { climateService } from "@/services/climate.service";
import { projectionService } from "@/services/projection.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id}/projections — histórico (RF6.2). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireCompany(id);
    const projections = await projectionService.listByCompany(id);
    return ok({ projections });
  });
}

/**
 * POST /api/companies/{id}/projections — generar proyección (RF6.1).
 * Si no se pasa `forecastTemp`, se usa el promedio histórico del mes.
 */
export function POST(request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    const { company } = await requireCompany(id);
    const input = await parseJson(request, createProjectionSchema);

    const month = input.month ?? new Date().getMonth() + 1;
    const forecastTemp =
      input.forecastTemp ??
      (await climateService.forecastTempFor(company.location, month)) ??
      10;

    const result = await projectionService.compute(id, {
      forecastTemp,
      year: input.year,
      month: input.month,
    });
    return ok(result, 201);
  });
}
