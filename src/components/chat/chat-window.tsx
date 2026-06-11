"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="flex h-[calc(100vh-16rem)] flex-col rounded-xl border border-border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
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
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {m.content || (streaming ? "…" : "")}
            </div>
          </div>
        ))}
        {tool && (
          <p className="text-xs italic text-muted-foreground">
            🔧 El agente está usando <code>{tool}</code>…
          </p>
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escribí un mensaje…  (Enter para enviar)"
          className="min-h-12 resize-none"
          disabled={streaming}
        />
        <Button onClick={send} disabled={streaming || !input.trim()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
