import { ok, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { alertService } from "@/services/alert.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id}/alerts — alertas de la empresa (RF7.2). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireCompany(id);
    const alerts = await alertService.listByCompany(id);
    return ok({ alerts });
  });
}
