import { ok, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { AppError } from "@/lib/errors";
import { conversationService } from "@/services/conversation.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/conversations/{id}/messages — turnos de una conversación (RF8.2). */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    const conversation = await conversationService.getById(id);
    if (!conversation) throw AppError.notFound("Conversación no encontrada");
    // aislamiento: la empresa de la conversación debe ser de la organización.
    await requireCompany(conversation.companyId);
    const messages = await conversationService.listMessages(id);
    return ok({ conversation, messages });
  });
}
