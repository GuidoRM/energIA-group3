"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Resumen" },
  { segment: "equipment", label: "Ítems" },
  { segment: "climate", label: "Clima" },
  { segment: "projections", label: "Proyecciones" },
  { segment: "alerts", label: "Alertas" },
  { segment: "agent", label: "Agente" },
];

export function CompanyTabs({
  companyId,
  unreadAlerts = 0,
}: {
  companyId: string;
  unreadAlerts?: number;
}) {
  const pathname = usePathname();
  const base = `/companies/${companyId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-8">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active =
          pathname === href || (tab.segment === "" && pathname === base);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.segment === "alerts" && unreadAlerts > 0 && (
              <Badge variant="destructive" className="h-4 min-w-4 px-1 py-0 text-[10px]">
                {unreadAlerts > 99 ? "99+" : unreadAlerts}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
