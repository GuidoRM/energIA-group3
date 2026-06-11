import { ok, parseJson, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { createEquipmentSchema } from "@/lib/validation";
import { equipmentService } from "@/services/equipment.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id}/equipment — equipos con consumo (RF4.1). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireCompany(id);
    const equipment = await equipmentService.listByCompany(id);
    return ok({ equipment });
  });
}

/** POST /api/companies/{id}/equipment — agregar equipo (RF4.2). */
export function POST(request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireCompany(id);
    const input = await parseJson(request, createEquipmentSchema);
    const equipment = await equipmentService.create(id, input);
    return ok({ equipment }, 201);
  });
}
