import { ok, parseJson, route } from "@/lib/api";
import { requireAlert } from "@/lib/guards";
import { updateAlertSchema } from "@/lib/validation";
import { alertService } from "@/services/alert.service";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/alerts/{id} — marcar leída/no leída (RF7.3). */
export function PATCH(request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireAlert(id);
    const input = await parseJson(request, updateAlertSchema);
    const alert = await alertService.setRead(id, input.isRead);
    return ok({ alert });
  });
}
