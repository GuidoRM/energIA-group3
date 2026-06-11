import { notFound } from "next/navigation";

import { ClimateChart } from "@/components/charts/climate-chart";
import { requireSession } from "@/lib/auth";
import { LOCATION_LABEL, monthName } from "@/lib/format";
import { climateService } from "@/services/climate.service";
import { companyService } from "@/services/company.service";

/** RF5.1–5.3 — dashboard de clima de la localidad de la empresa. */
export default async function ClimatePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const session = await requireSession();
  const company = await companyService
    .getForOrg(companyId, session.organizationId)
    .catch(() => null);
  if (!company) notFound();

  const currentMonth = new Date().getMonth() + 1;
  const [series, forecast] = await Promise.all([
    climateService.getSeries(company.location),
    climateService.forecastTempFor(company.location, currentMonth),
  ]);

  const temps = series.map((s) => Number(s.meanTemp));
  const minTemp = temps.length > 0 ? Math.min(...temps) : null;
  const maxTemp = temps.length > 0 ? Math.max(...temps) : null;
  const minMonth = minTemp !== null ? series.find((s) => Number(s.meanTemp) === minTemp) : null;
  const maxMonth = maxTemp !== null ? series.find((s) => Number(s.meanTemp) === maxTemp) : null;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-bold text-[#0f172a]">Datos climáticos</h2>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Temperaturas medias mensuales (IPIEC) · Tierra del Fuego — impactan directamente en el consumo energético proyectado.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ClimateCard
          label="Localidad"
          value={LOCATION_LABEL[company.location] ?? company.location}
          sub="Patagonia austral"
          accent="#6366f1"
        />
        <ClimateCard
          label={`Temp. prevista — ${monthName(currentMonth)}`}
          value={forecast !== null ? `${forecast}°C` : "—"}
          sub="Promedio histórico del mes"
          accent="#0ea5e9"
          dotColor="bg-[#0ea5e9]"
        />
        <ClimateCard
          label="Mínima histórica"
          value={minTemp !== null ? `${minTemp}°C` : "—"}
          sub={minMonth ? `${monthName(minMonth.month)} (mes más frío)` : "Sin datos"}
          accent="#3b82f6"
          dotColor="bg-[#3b82f6]"
        />
        <ClimateCard
          label="Máxima histórica"
          value={maxTemp !== null ? `${maxTemp}°C` : "—"}
          sub={maxMonth ? `${monthName(maxMonth.month)} (mes más cálido)` : "Sin datos"}
          accent="#f59e0b"
          dotColor="bg-[#f59e0b]"
        />
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
        <div className="border-b border-[#e2e8f0] px-6 py-4">
          <p className="text-sm font-bold text-[#0f172a]">Temperatura media mensual (IPIEC)</p>
          <p className="mt-0.5 text-xs text-[#64748b]">Serie histórica · °C promedio por mes</p>
        </div>
        <div className="p-6">
          {series.length === 0 ? (
            <p className="text-sm text-[#64748b]">
              No hay datos de clima. Corré <code className="rounded bg-[#f1f5f9] px-1 py-0.5 font-mono text-xs">npm run db:seed</code>.
            </p>
          ) : (
            <ClimateChart series={series} />
          )}
        </div>
      </div>
    </div>
  );
}

function ClimateCard({
  label,
  value,
  sub,
  accent,
  dotColor,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  dotColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full opacity-[0.07]" style={{ background: accent }} />
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-[#64748b] leading-snug pr-2">{label}</p>
        {dotColor && <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />}
      </div>
      <p className="mt-1.5 text-2xl font-black text-[#0f172a]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#94a3b8]">{sub}</p>
    </div>
  );
}
