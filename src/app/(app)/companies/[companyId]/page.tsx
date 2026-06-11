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

  const baseConsumption = equipment.reduce(
    (sum, e) => sum + e.monthlyConsumption,
    0,
  );
  const latest = projections[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Equipos" value={String(equipment.length)} />
        <Metric label="Consumo base / mes" value={formatNumber(baseConsumption)} />
        <Metric
          label="Última proyección"
          value={latest ? formatCurrency(latest.estimatedCost) : "—"}
          sub={
            latest
              ? `${monthName(latest.month)} · ${formatPct(latest.variationPct ?? 0)}`
              : "Sin proyecciones"
          }
        />
        <Metric label="Alertas sin leer" value={String(unread)} />
      </div>

      <div className="bg-white rounded-2xl border border-[#e5beb3] p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#281813] mb-4">Próximos pasos</h3>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link
            className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-full text-sm font-bold text-[#FD5212] bg-[#FD5212]/5 hover:bg-[#FD5212]/10 transition-all active:scale-[0.98] border border-[#FD5212]/20"
            href={`/companies/${companyId}/equipment`}
          >
            Cargar equipos
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-full text-sm font-bold text-[#FD5212] bg-[#FD5212]/5 hover:bg-[#FD5212]/10 transition-all active:scale-[0.98] border border-[#FD5212]/20"
            href={`/companies/${companyId}/projections`}
          >
            Generar proyección
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-full text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] transition-all active:scale-[0.98] shadow-sm"
            href={`/companies/${companyId}/agent`}
          >
            Hablar con Hermes
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#E8D7CA] rounded-2xl border border-[#d2baa9] p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#FD5212]/30">
      <p className="text-xs font-bold text-[#8A726B] uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[#281813]">{value}</p>
      {sub && <p className="mt-2 text-xs font-semibold text-[#8A726B]">{sub}</p>}
    </div>
  );
}
