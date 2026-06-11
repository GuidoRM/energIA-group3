"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";
interface ChatMessage {
  role: ChatRole;
  content: string;
}

export function ChatWindow({
  companyId,
  initialMessages,
  initialConversationId,
}: {
  companyId: string;
  initialMessages: ChatMessage[];
  initialConversationId?: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const conversationId = useRef(initialConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, tool]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);
    setTool(null);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`/api/companies/${companyId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId.current,
        }),
      });
      if (!res.body) throw new Error("sin stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const event = JSON.parse(line.slice(5).trim());
          handleEvent(event);
        }
      }
    } catch {
      appendToAssistant("\n[Error de conexión con el agente]");
    } finally {
      setStreaming(false);
      setTool(null);
      router.refresh(); // refresca las otras vistas (RF8.5)
    }
  }

  function appendToAssistant(text: string) {
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last && last.role === "assistant") {
        copy[copy.length - 1] = { ...last, content: last.content + text };
      }
      return copy;
    });
  }

  function handleEvent(event: { type: string; value?: string; conversationId?: string; name?: string }) {
    switch (event.type) {
      case "start":
        if (event.conversationId) conversationId.current = event.conversationId;
        break;
      case "token":
        if (event.value) appendToAssistant(event.value);
        break;
      case "tool":
        setTool(event.name ?? null);
        break;
      case "error":
        appendToAssistant("\n[El agente no está disponible]");
        break;
    }
  }

  return (
    <div className="flex h-[calc(100vh-16rem)] flex-col rounded-2xl border border-[#e5beb3] bg-white shadow-sm overflow-hidden font-sans">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6 bg-[#fff8f6]/30">
        {messages.length === 0 && (
          <p className="text-sm text-[#8A726B] font-medium pl-2">
            Hablá con Hermes para construir el gemelo digital de tu empresa.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm border transition-all duration-200",
                m.role === "user"
                  ? "bg-[#FD5212] text-white border-[#FD5212] rounded-tr-none"
                  : "bg-[#E8D7CA] text-[#281813] border-[#d2baa9]/40 rounded-tl-none",
              )}
            >
              {m.content || (streaming ? "…" : "")}
            </div>
          </div>
        ))}
        {tool && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#C15735] bg-[#fff8f6] border border-[#e5beb3] shadow-sm animate-pulse">
              <span>🔧</span>
              <span>El agente está usando <code className="bg-[#E8D7CA]/40 px-1 py-0.5 rounded font-mono text-[10px]">{tool}</code>…</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-[#e5beb3] p-4 bg-[#fff8f6]/40">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escribí un mensaje… (Enter para enviar)"
          className="flex-1 min-h-[44px] max-h-[120px] resize-none px-4 py-2.5 border border-[#e5beb3] rounded-xl bg-white text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
          disabled={streaming}
          rows={1}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          className="flex justify-center items-center py-2.5 px-6 h-[44px] rounded-full text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FD5212] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
