"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

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
  const [focused, setFocused] = useState(false);
  const conversationId = useRef(initialConversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync when parent re-renders with a new conversation
  useEffect(() => {
    setMessages(initialMessages);
    setAlertBanners([]);
    conversationId.current = initialConversationId;
  }, [initialConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, tool, alertBanners]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] shadow-sm shadow-[#0ea5e9]/20">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 21v-9H5L13 3v9h6L11 21z" />
                </svg>
              </div>
              <div className="rounded-2xl rounded-tl-none border border-[#e0f2fe] bg-[#f0f9ff] px-4 py-3 text-sm text-[#0369a1]">
                <p className="font-semibold leading-snug">¡Hola! Soy tu Copiloto Energético.</p>
                <p className="mt-1 text-[#0284c7] leading-relaxed">
                  Puedo ayudarte a analizar consumo, proyectar costos, cargar equipos y optimizar tu gasto energético. ¿Por dónde empezamos?
                </p>
              </div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border transition-all duration-200",
                m.role === "user"
                  ? "bg-[#0f172a] text-white border-[#0f172a] rounded-tr-none"
                  : "bg-[#f1f5f9] text-[#0f172a] border-[#e2e8f0] rounded-tl-none",
              )}
            >
              {m.content ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      return isBlock ? (
                        <code className={cn(
                          "block rounded-lg px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap",
                          m.role === "user"
                            ? "bg-white/10 text-white/90"
                            : "bg-[#e2e8f0] text-[#0f172a]",
                        )}>{children}</code>
                      ) : (
                        <code className={cn(
                          "rounded px-1 py-0.5 font-mono text-[11px]",
                          m.role === "user"
                            ? "bg-white/15 text-white"
                            : "bg-[#e2e8f0] text-[#0f172a]",
                        )}>{children}</code>
                      );
                    },
                    pre: ({ children }) => <pre className="mb-2 last:mb-0 overflow-x-auto">{children}</pre>,
                    h1: ({ children }) => <h1 className="mb-2 text-base font-bold">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-1.5 text-sm font-bold">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className={cn(
                        "my-2 border-l-2 pl-3 italic",
                        m.role === "user" ? "border-white/30 text-white/80" : "border-[#0ea5e9] text-[#64748b]",
                      )}>{children}</blockquote>
                    ),
                    hr: () => <hr className={cn("my-2", m.role === "user" ? "border-white/20" : "border-[#e2e8f0]")} />,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className={cn("underline underline-offset-2", m.role === "user" ? "text-cyan-300" : "text-[#0ea5e9]")}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                streaming ? <span className="opacity-60">…</span> : null
              )}
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

      <div className="shrink-0 border-t border-[#e2e8f0] bg-white p-3">
        <div
          className={cn(
            "relative rounded-2xl border transition-all duration-200",
            focused
              ? "border-[#0ea5e9] bg-white ring-2 ring-[#0ea5e9]/15"
              : "border-[#e2e8f0] bg-[#f8fafc]",
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Escribí un mensaje…"
            className="w-full resize-none bg-transparent px-4 pb-11 pt-3.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
            style={{ minHeight: "52px", maxHeight: "160px" }}
            disabled={streaming}
            rows={1}
          />

          {/* Bottom bar integrada */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2.5">
            <span className="select-none text-[11px] text-[#cbd5e1]">
              Shift+Enter para nueva línea
            </span>
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
                input.trim() && !streaming
                  ? "bg-[#0ea5e9] text-white shadow-sm hover:bg-[#0284c7] active:scale-95 cursor-pointer"
                  : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed",
              )}
            >
              {streaming ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
