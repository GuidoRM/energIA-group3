"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div
      className={cn(
        "font-sans",
        bare
          ? "flex flex-col flex-1 overflow-hidden"
          : "flex h-[calc(100vh-16rem)] flex-col rounded-2xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden",
      )}
    >
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6 bg-[#f8fafc]/50">
        {messages.length === 0 && alertBanners.length === 0 && (
          <p className="text-sm text-[#64748b] font-medium pl-2">
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
                  ? "bg-[#0f172a] text-white border-[#0f172a] rounded-tr-none"
                  : "bg-[#f1f5f9] text-[#0f172a] border-[#e2e8f0] rounded-tl-none",
              )}
            >
              {m.content || (streaming ? "…" : "")}
            </div>
          </div>
        ))}
        {tool && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#0ea5e9] bg-[#e0f2fe] border border-[#bae6fd] shadow-sm animate-pulse">
              <span>🔧</span>
              <span>El agente está usando <code className="bg-[#e0f2fe] px-1 py-0.5 rounded font-mono text-[10px]">{tool}</code>…</span>
            </div>
          </div>
        )}
        {alertBanners.map((a, i) => (
          <div
            key={`alert-${i}`}
            className={cn("rounded-xl border px-4 py-3 text-sm font-medium", SEVERITY_COLOR[a.severity])}
          >
            <span className="font-bold">{SEVERITY_LABEL[a.severity]}:</span>{" "}
            {a.message}
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 border-t border-[#e2e8f0] p-4 bg-white">
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
          className="flex-1 min-h-[44px] max-h-[120px] resize-none px-4 py-2.5 border border-[#e2e8f0] rounded-xl bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200"
          disabled={streaming}
          rows={1}
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          className="flex justify-center items-center py-2.5 px-6 h-[44px] rounded-full text-sm font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ea5e9] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
