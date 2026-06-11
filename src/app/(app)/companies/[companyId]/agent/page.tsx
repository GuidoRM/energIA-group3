import { ChatWindow } from "@/components/chat/chat-window";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { conversationService } from "@/services/conversation.service";

/** RF8 — chat con Hermes por empresa, con historial multi-conversación. */
export default async function AgentPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ c?: string; new?: string }>;
}) {
  const { companyId } = await params;
  const { c: activeConversationId, new: isNew } = await searchParams;

  const conversations = await conversationService.listByCompany(companyId);

  // ?new=1  → chat vacío (usuario eligió "Nueva conversación")
  // ?c=uuid → carga esa conversación
  // sin params → abre la más reciente (primer acceso)
  const active = isNew
    ? undefined
    : activeConversationId
      ? conversations.find((conv) => conv.id === activeConversationId)
      : conversations[0];

  const messages = active
    ? await conversationService.listMessages(active.id)
    : [];

  const initialMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  return (
    <div className="flex h-[calc(100vh-14rem)] overflow-hidden rounded-xl border border-border bg-card">
      <ConversationSidebar
        companyId={companyId}
        conversations={conversations}
        activeId={active?.id}
      />
      <ChatWindow
        companyId={companyId}
        initialMessages={initialMessages}
        initialConversationId={active?.id}
        bare
      />
    </div>
  );
}
