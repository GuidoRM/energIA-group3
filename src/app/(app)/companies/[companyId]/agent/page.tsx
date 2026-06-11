import { ChatWindow } from "@/components/chat/chat-window";
import { conversationService } from "@/services/conversation.service";

/** RF8 — chat con Hermes por empresa. */
export default async function AgentPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Retoma la conversación más reciente, si existe (RF8.3).
  const conversations = await conversationService.listByCompany(companyId);
  const latest = conversations[0];
  const messages = latest
    ? await conversationService.listMessages(latest.id)
    : [];

  const initialMessages = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  return (
    <ChatWindow
      companyId={companyId}
      initialMessages={initialMessages}
      initialConversationId={latest?.id}
    />
  );
}
