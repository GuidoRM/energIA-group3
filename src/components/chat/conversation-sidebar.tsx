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

  function startNew() {
    router.push(`/companies/${companyId}/agent?new=1`);
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
      <div className="p-3 border-b border-border">
        <button
          onClick={startNew}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          + Nueva conversación
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="px-2 py-3 text-xs text-muted-foreground">
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
                "flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
              )}
            >
              <span className={cn("line-clamp-2 leading-snug", isActive && "font-medium")}>
                {title}
              </span>
              <span className="text-[11px] opacity-60">
                {formatDate(conv.updatedAt)}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
