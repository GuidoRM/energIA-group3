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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[16px] border border-[#e5beb3] p-6 sm:p-8 w-full shadow-sm">
        <h3 className="text-lg font-bold text-[#281813] mb-4 font-sans">Generar proyección</h3>
        <form onSubmit={generate} className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="forecastTemp">
              Temperatura prevista (°C)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
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
                className="block w-48 pl-10 pr-3 py-2.5 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center items-center py-2.5 px-6 rounded-full text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FD5212] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm h-[42px]"
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
        <p className="text-sm text-[#8A726B] font-medium pl-2">
          Todavía no hay proyecciones. Generá la primera.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#d2baa9] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#E8D7CA]/80 text-left text-[#8A726B] border-b border-[#d2baa9]">
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
                  <tr key={p.id} className="border-t border-[#d2baa9]/40 hover:bg-[#E8D7CA]/10 transition-colors">
                    <td className="px-5 py-3 font-bold text-[#281813]">
                      {monthName(p.month)} {p.year}
                    </td>
                    <td className="px-5 py-3 text-right text-[#5c4038] font-semibold">{Number(p.forecastTemp)}°C</td>
                    <td className="px-5 py-3 text-right text-[#5c4038] font-semibold">
                      {formatNumber(p.estimatedConsumption)}
                    </td>
                    <td className="px-5 py-3 text-right text-[#281813] font-bold">
                      {formatCurrency(p.estimatedCost)}
                    </td>
                    <td
                      className={
                        "px-5 py-3 text-right font-bold " +
                        (variation > 0 ? "text-[#ba1a1a]" : "text-[#0092F0]")
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
