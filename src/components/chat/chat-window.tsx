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

interface AlertBanner {
  severity: "low" | "medium" | "high";
  message: string;
}

const SEVERITY_COLOR: Record<AlertBanner["severity"], string> = {
  low: "bg-amber-50 border-amber-200 text-amber-800",
  medium: "bg-orange-50 border-orange-200 text-orange-800",
  high: "bg-red-50 border-red-200 text-red-800",
};

const SEVERITY_LABEL: Record<AlertBanner["severity"], string> = {
  low: "Alerta baja",
  medium: "Alerta media",
  high: "Alerta alta",
};

export function ChatWindow({
  companyId,
  initialMessages,
  initialConversationId,
  bare = false,
}: {
  companyId: string;
  initialMessages: ChatMessage[];
  initialConversationId?: string;
  bare?: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const [alertBanners, setAlertBanners] = useState<AlertBanner[]>([]);
  const conversationId = useRef(initialConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync when parent re-renders with a new conversation
  useEffect(() => {
    setMessages(initialMessages);
    setAlertBanners([]);
    conversationId.current = initialConversationId;
  }, [initialConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, tool, alertBanners]);

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
      router.refresh();
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

  function handleEvent(event: {
    type: string;
    value?: string;
    conversationId?: string;
    name?: string;
    severity?: AlertBanner["severity"];
    message?: string;
  }) {
    switch (event.type) {
      case "start":
        if (event.conversationId) {
          conversationId.current = event.conversationId;
          // Actualizar URL sin navigation para que el sidebar lo refleje.
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.set("c", event.conversationId);
            window.history.replaceState(null, "", url.toString());
          }
        }
        break;
      case "token":
        if (event.value) appendToAssistant(event.value);
        break;
      case "tool":
        setTool(event.name ?? null);
        break;
      case "alert":
        if (event.severity && event.message) {
          setAlertBanners((prev) => [
            ...prev,
            { severity: event.severity!, message: event.message! },
          ]);
        }
        break;
      case "error":
        appendToAssistant("\n[El agente no está disponible]");
        break;
    }
  }

  const outer = bare
    ? "flex flex-col flex-1 overflow-hidden"
    : "flex h-[calc(100vh-16rem)] flex-col rounded-xl border border-border bg-card";

  return (
    <div className={outer}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && alertBanners.length === 0 && (
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
        {alertBanners.map((a, i) => (
          <div
            key={`alert-${i}`}
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              SEVERITY_COLOR[a.severity],
            )}
          >
            <span className="font-semibold">{SEVERITY_LABEL[a.severity]}:</span>{" "}
            {a.message}
          </div>
        ))}
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
