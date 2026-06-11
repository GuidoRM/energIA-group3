import { noContent, ok, parseJson, route } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { updateCompanySchema } from "@/lib/validation";
import { companyService } from "@/services/company.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id} — detalle (RF3.3). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const session = await requireSession();
    const { id } = await ctx.params;
    const company = await companyService.getForOrg(id, session.organizationId);
    return ok({ company });
  });
}

/** PATCH /api/companies/{id} — editar (RF3.4). */
export function PATCH(request: Request, ctx: Ctx) {
  return route(async () => {
    const session = await requireSession();
    const { id } = await ctx.params;
    await companyService.getForOrg(id, session.organizationId); // aislamiento
    const input = await parseJson(request, updateCompanySchema);
    const company = await companyService.update(id, input);
    return ok({ company });
  });
}

/** DELETE /api/companies/{id} — eliminar con cascada (RF3.4). */
export function DELETE(_request: Request, ctx: Ctx) {
  return route(async () => {
    const session = await requireSession();
    const { id } = await ctx.params;
    await companyService.getForOrg(id, session.organizationId);
    await companyService.remove(id);
    return noContent();
  });
}
