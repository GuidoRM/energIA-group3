"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

function formatDate(value: Date | string): string {
  const d = new Date(value);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dStart >= todayStart) {
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }
  if (dStart >= yesterdayStart) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function ConversationSidebar({
  companyId,
  conversations,
  activeId,
}: {
  companyId: string;
  conversations: Conversation[];
  activeId: string | undefined;
}) {
  const router = useRouter();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[#e2e8f0] bg-[#f8fafc]">
      <div className="p-3 border-b border-[#e2e8f0]">
        <button
          onClick={() => router.push(`/companies/${companyId}/agent?new=1`)}
          className="flex w-full items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 text-left text-sm font-semibold text-[#64748b] shadow-sm hover:border-[#0ea5e9]/50 hover:text-[#0ea5e9] transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva conversación
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="px-3 py-3 text-xs text-[#94a3b8] font-medium">
            Sin conversaciones aún.
          </p>
        )}
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          const title = conv.title?.trim() || "Nueva conversación";
          return (
            <Link
              key={conv.id}
              href={`/companies/${companyId}/agent?c=${conv.id}`}
              className={cn(
                "flex flex-col gap-0.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-white border border-[#e2e8f0] shadow-sm text-[#0f172a]"
                  : "text-[#64748b] hover:bg-white hover:text-[#0f172a]",
              )}
            >
              <span className={cn("line-clamp-2 leading-snug text-xs", isActive && "font-semibold text-[#0f172a]")}>
                {title}
              </span>
              <span className="text-[10px] text-[#94a3b8]">
                {formatDate(conv.updatedAt)}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
