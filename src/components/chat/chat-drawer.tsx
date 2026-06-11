"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { ChatWindow } from "./chat-window";

interface ChatContext {
  conversationId: string | null;
  messages: { role: "user" | "assistant"; content: string }[];
}

export function ChatDrawer({
  companyId,
  open,
  onClose,
}: {
  companyId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [ctx, setCtx] = useState<ChatContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/companies/${companyId}/chat-context`)
      .then((r) => r.json())
      .then((data) => setCtx(data))
      .catch(() => setCtx({ conversationId: null, messages: [] }))
      .finally(() => setLoading(false));
  }, [open, companyId]);

  function startNewConversation() {
    setCtx({ conversationId: null, messages: [] });
    setChatKey((k) => k + 1);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center gap-3.5 border-b border-[#e2e8f0] bg-white px-5 py-4">
          {/* Cyan accent line at top */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#0ea5e9] via-[#22d3ee] to-[#38bdf8] rounded-tl-none" />

          {/* Avatar con gradiente */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] shadow-md shadow-[#0ea5e9]/30">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 21v-9H5L13 3v9h6L11 21z" />
            </svg>
          </div>

          {/* Nombre y estado */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold leading-none text-[#0f172a]">
                Copiloto Energético
              </p>
            </div>
            <p className="mt-1 text-xs text-[#64748b] leading-none">
              Optimización energética · EnergIA
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={startNewConversation}
              title="Nueva conversación"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0ea5e9] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="10" y1="10" x2="14" y2="10" />
              </svg>
            </button>

            <Link
              href={`/companies/${companyId}/agent`}
              onClick={onClose}
              title="Ver historial completo"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0ea5e9] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>

            <button
              onClick={onClose}
              title="Cerrar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cuerpo del chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#22d3ee] shadow-md shadow-[#0ea5e9]/30">
                <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[#64748b]">Cargando conversación…</p>
            </div>
          ) : ctx ? (
            <ChatWindow
              key={chatKey}
              companyId={companyId}
              initialMessages={ctx.messages}
              initialConversationId={ctx.conversationId ?? undefined}
              bare
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
