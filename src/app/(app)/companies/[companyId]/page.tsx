import Link from "next/link";

import { formatCurrency, formatNumber, formatPct, monthName } from "@/lib/format";
import { alertService } from "@/services/alert.service";
import { equipmentService } from "@/services/equipment.service";
import { projectionService } from "@/services/projection.service";

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const [equipment, projections, unread] = await Promise.all([
    equipmentService.listByCompany(companyId),
    projectionService.listByCompany(companyId),
    alertService.countUnread(companyId),
  ]);

  const baseConsumption = equipment.reduce((sum, e) => sum + e.monthlyConsumption, 0);
  const latest = projections[0];

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Equipos"
          value={String(equipment.length)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          }
          accent="orange"
        />
        <Metric
          label="Consumo base / mes"
          value={formatNumber(baseConsumption)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 21v-9H5L13 3v9h6L11 21z" />
            </svg>
          }
          accent="cyan"
        />
        <Metric
          label="Última proyección"
          value={latest ? formatCurrency(latest.estimatedCost) : "—"}
          sub={latest ? `${monthName(latest.month)} · ${formatPct(latest.variationPct ?? 0)}` : "Sin proyecciones"}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
            </svg>
          }
          accent="cyan"
        />
        <Metric
          label="Alertas sin leer"
          value={String(unread)}
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
          }
          accent={unread > 0 ? "orange" : "neutral"}
        />
      </div>

      {/* Next steps */}
      <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#64748b]">
          Próximos pasos
        </h3>
        <div className="flex flex-wrap gap-3">
          <StepLink href={`/companies/${companyId}/equipment`} label="Cargar equipos" />
          <StepLink href={`/companies/${companyId}/projections`} label="Generar proyección" />
          <StepLink href={`/companies/${companyId}/agent`} label="Hablar con EnergIA" primary />
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: "orange" | "cyan" | "neutral";
}) {
  const iconBg = {
    orange: "bg-[#FD5212]/10 text-[#FD5212]",
    cyan: "bg-[#0ea5e9]/10 text-[#0ea5e9]",
    neutral: "bg-[#f1f5f9] text-[#64748b]",
  }[accent];

  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-extrabold text-[#0f172a]">{value}</p>
      {sub && <p className="mt-1.5 text-xs font-medium text-[#64748b]">{sub}</p>}
    </div>
  );
}

function StepLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] transition-all active:scale-[0.98] shadow-sm shadow-[#FD5212]/20"
          : "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#0ea5e9] bg-[#e0f2fe] hover:bg-[#bae6fd] transition-all active:scale-[0.98]"
      }
    >
      {label}
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </Link>
  );
}
