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
  { segment: "agent", label: "Agente" },
];

export function CompanyTabs({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const base = `/companies/${companyId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-8">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active =
          pathname === href ||
          (tab.segment === "" && pathname === base);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
