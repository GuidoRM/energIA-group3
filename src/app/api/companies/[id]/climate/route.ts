import { ok, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { climateService } from "@/services/climate.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id}/climate — serie de clima de la localidad (RF5.1/5.2). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    const { company } = await requireCompany(id);
    const series = await climateService.getSeries(company.location);
    const currentMonth = new Date().getMonth() + 1;
    const forecastTemp = await climateService.forecastTempFor(
      company.location,
      currentMonth,
    );
    return ok({ location: company.location, series, forecast: { month: currentMonth, temp: forecastTemp } });
  });
}
