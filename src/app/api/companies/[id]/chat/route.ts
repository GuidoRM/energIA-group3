import { parseJson, route } from "@/lib/api";
import { requireCompany } from "@/lib/guards";
import { chatMessageSchema } from "@/lib/validation";
import { conversationService } from "@/services/conversation.service";
import { hermesService, ONBOARDING_PROMPT } from "@/services/hermes.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/companies/{id}/chat — envía un mensaje a Hermes y reenvía el
 * stream a la UI vía SSE (RF8.1/8.4, §5.2). Es un proxy: la API key de Hermes
 * nunca llega al front (RNF1).
 */
export function POST(request: Request, ctx: Ctx) {
  return route(async () => {
    const { id } = await ctx.params;
    const { session } = await requireCompany(id);
    const input = await parseJson(request, chatMessageSchema);

    const conversation = await conversationService.resolve({
      companyId: id,
      userId: session.userId,
      conversationId: input.conversationId,
    });

    // Contexto previo (solo turnos usuario/asistente) ANTES de guardar el nuevo.
    const previous = await conversationService.listMessages(conversation.id);
    const history = previous
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    // RF8.2 — persistir el turno del usuario.
    await conversationService.addMessage({
      conversationId: conversation.id,
      role: "user",
      content: input.message,
    });

    const encoder = new TextEncoder();
    const send = (
      controller: ReadableStreamDefaultController,
      payload: unknown,
    ) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

    const stream = new ReadableStream({
      async start(controller) {
        send(controller, { type: "start", conversationId: conversation.id });

        let assistantText = "";
        const toolsUsed: string[] = [];

        try {
          for await (const event of hermesService.stream({
            conversation: `company-${id}`,
            systemPrompt: ONBOARDING_PROMPT,
            userMessage: input.message,
            history,
          })) {
            if (event.type === "token") {
              assistantText += event.value;
              send(controller, { type: "token", value: event.value });
            } else if (event.type === "tool") {
              toolsUsed.push(event.name);
              // evento de progreso: "el agente está guardando…" (§10)
              send(controller, { type: "tool", name: event.name });
              await conversationService.addMessage({
                conversationId: conversation.id,
                role: "tool",
                content: "",
                toolName: event.name,
              });
            } else if (event.type === "done") {
              assistantText = event.content || assistantText;
            }
          }

          // RF8.2 — persistir la respuesta del asistente.
          await conversationService.addMessage({
            conversationId: conversation.id,
            role: "assistant",
            content: assistantText,
          });

          send(controller, { type: "done", tools: toolsUsed });
        } catch (error) {
          console.error("Chat stream error:", error);
          send(controller, {
            type: "error",
            message: "El agente no está disponible.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  });
}
