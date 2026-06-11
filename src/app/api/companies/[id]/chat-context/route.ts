import { ok, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { conversationService } from "@/services/conversation.service";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/companies/{id}/chat-context — última conversación con mensajes para el drawer. */
export function GET(_request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    await requireCompany(id);

    const conversations = await conversationService.listByCompany(id);
    if (!conversations[0]) {
      return ok({ conversationId: null, messages: [] });
    }

    const latest = conversations[0];
    const rawMessages = await conversationService.listMessages(latest.id);
    const messages = rawMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    return ok({ conversationId: latest.id, messages });
  });
}
