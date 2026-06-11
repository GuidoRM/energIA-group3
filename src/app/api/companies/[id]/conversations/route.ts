import { ok, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { conversationService } from "@/services/conversation.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id}/conversations — conversaciones de la empresa (RF8.3). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireCompany(id);
    const conversations = await conversationService.listByCompany(id);
    return ok({ conversations });
  });
}
