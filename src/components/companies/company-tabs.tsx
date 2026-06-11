"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Resumen" },
  { segment: "equipment", label: "Ítems" },
  { segment: "climate", label: "Clima" },
  { segment: "projections", label: "Proyecciones" },
  { segment: "alerts", label: "Alertas" },
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
    <nav className="flex gap-0 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href || (tab.segment === "" && pathname === base);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "border-[#0ea5e9] text-[#0ea5e9]"
                : "border-transparent text-[#64748b] hover:text-[#0f172a] hover:border-[#e2e8f0]",
            )}
          >
            {tab.label}
            {tab.segment === "alerts" && unreadAlerts > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
                {unreadAlerts > 99 ? "99+" : unreadAlerts}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
