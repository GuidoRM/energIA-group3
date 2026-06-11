"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/client";
import { formatCurrency, formatNumber, formatPct, monthName } from "@/lib/format";
import type { Projection } from "@/lib/types";

export function ProjectionPanel({
  companyId,
  initial,
  suggestedTemp,
}: {
  companyId: string;
  initial: Projection[];
  suggestedTemp: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const temp = form.get("forecastTemp");
    const body: Record<string, unknown> = {};
    if (temp !== null && temp !== "") body.forecastTemp = Number(temp);
    try {
      await apiFetch(`/api/companies/${companyId}/projections`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const latest = initial[0];
  const maxVar = initial.length > 0 ? Math.max(...initial.map((p) => Number(p.variationPct ?? 0))) : null;
  const minVar = initial.length > 0 ? Math.min(...initial.map((p) => Number(p.variationPct ?? 0))) : null;
  const avgCost =
    initial.length > 0
      ? initial.reduce((sum, p) => sum + Number(p.estimatedCost), 0) / initial.length
      : null;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-bold text-[#0f172a]">Proyecciones de consumo</h2>
        <p className="mt-0.5 text-sm text-[#64748b]">
          Estimaciones de costo y consumo energético modeladas a partir de la temperatura prevista.
        </p>
      </div>

      {/* Stat cards */}
      {initial.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ProjStatCard
            label="Proyecciones totales"
            value={String(initial.length)}
            sub="Períodos calculados"
            accent="#6366f1"
          />
          <ProjStatCard
            label="Última proyección"
            value={latest ? formatCurrency(latest.estimatedCost) : "—"}
            sub={latest ? `${monthName(latest.month)} ${latest.year}` : ""}
            accent="#0ea5e9"
            dotColor="bg-[#0ea5e9]"
          />
          <ProjStatCard
            label="Mayor variación"
            value={maxVar !== null ? `${maxVar > 0 ? "+" : ""}${formatPct(maxVar)}` : "—"}
            sub="Pico máximo registrado"
            accent="#ef4444"
            dotColor="bg-[#ef4444]"
          />
          <ProjStatCard
            label="Costo promedio"
            value={avgCost !== null ? formatCurrency(avgCost) : "—"}
            sub="Promedio de todos los períodos"
            accent="#22c55e"
          />
        </div>
      )}

      <div className="bg-white rounded-[16px] border border-[#e2e8f0] p-6 sm:p-8 w-full shadow-sm">
        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Generar proyección</h3>
        <form onSubmit={generate} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider" htmlFor="forecastTemp">
              Temperatura prevista (°C)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-3-9c.55 0 1 .45 1 1v3h-2V5c0-.55.45-1 1-1z" />
                </svg>
              </div>
              <input
                id="forecastTemp"
                name="forecastTemp"
                type="number"
                step="0.1"
                defaultValue={suggestedTemp ?? undefined}
                placeholder="promedio histórico"
                className="block w-48 pl-10 pr-3 py-2.5 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center items-center py-2.5 px-6 rounded-full text-sm font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ea5e9] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm h-[42px]"
          >
            {loading ? "Calculando…" : "Calcular"}
          </button>
          {error && (
            <div className="p-3 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 rounded-lg text-sm text-[#ba1a1a] font-medium flex items-center gap-2">
              <svg className="w-5 h-5 select-none text-[#ba1a1a]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </div>
          )}
        </form>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-[#64748b] font-medium pl-2">
          Todavía no hay proyecciones. Generá la primera.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#f8fafc] text-left text-[#64748b] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-xs">Período</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Temp.</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Consumo</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Costo</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Variación</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((p) => {
                const variation = Number(p.variationPct ?? 0);
                return (
                  <tr key={p.id} className="border-t border-[#e2e8f0]/60 hover:bg-[#f8fafc] transition-colors">
                    <td className="px-5 py-3 font-bold text-[#0f172a]">
                      {monthName(p.month)} {p.year}
                    </td>
                    <td className="px-5 py-3 text-right text-[#64748b] font-semibold">{Number(p.forecastTemp)}°C</td>
                    <td className="px-5 py-3 text-right text-[#64748b] font-semibold">
                      {formatNumber(p.estimatedConsumption)}
                    </td>
                    <td className="px-5 py-3 text-right text-[#0f172a] font-bold">
                      {formatCurrency(p.estimatedCost)}
                    </td>
                    <td
                      className={
                        "px-5 py-3 text-right font-bold " +
                        (variation > 0 ? "text-[#ef4444]" : "text-[#0ea5e9]")
                      }
                    >
                      {variation > 0 ? "+" : ""}{formatPct(variation)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjStatCard({
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
        <p className="text-xs font-semibold text-[#64748b]">{label}</p>
        {dotColor && <span className={`mt-0.5 h-2 w-2 rounded-full ${dotColor}`} />}
      </div>
      <p className="mt-1.5 text-2xl font-black text-[#0f172a]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#94a3b8]">{sub}</p>
    </div>
  );
}
