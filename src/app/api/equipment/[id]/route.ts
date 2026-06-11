import { noContent, ok, parseJson, route } from "@/lib/api";
import { requireEquipment } from "@/lib/guards";
import { updateEquipmentSchema } from "@/lib/validation";
import { equipmentService } from "@/services/equipment.service";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/equipment/{id} — editar equipo (RF4.3). */
export function PATCH(request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireEquipment(id);
    const input = await parseJson(request, updateEquipmentSchema);
    const equipment = await equipmentService.update(id, input);
    return ok({ equipment });
  });
}

/** DELETE /api/equipment/{id} — eliminar equipo (RF4.3). */
export function DELETE(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireEquipment(id);
    await equipmentService.remove(id);
    return noContent();
  });
}
