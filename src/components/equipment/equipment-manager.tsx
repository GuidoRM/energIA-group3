"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/client";
import { formatNumber, VECTOR_LABEL } from "@/lib/format";
import type { EquipmentWithConsumption } from "@/lib/types";

export function EquipmentManager({
  companyId,
  initial,
}: {
  companyId: string;
  initial: EquipmentWithConsumption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name")),
      vector: String(form.get("vector")),
      power: Number(form.get("power")),
      hoursPerDay: Number(form.get("hoursPerDay")),
      daysPerMonth: Number(form.get("daysPerMonth")),
    };
    try {
      await apiFetch(`/api/companies/${companyId}/equipment`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/api/equipment/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[16px] border border-[#e5beb3] p-6 sm:p-8 w-full shadow-sm">
        <form onSubmit={add} className="grid items-end gap-4 sm:grid-cols-6">
          {/* Name Input */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="name">
              Equipo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
              </div>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Ej: Horno"
                className="block w-full pl-10 pr-3 py-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-sm text-[#281813] placeholder:text-[#64748b]/50 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Vector Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="vector">
              Vector
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 21v-9H5L13 3v9h6L11 21z" />
                </svg>
              </div>
              <select
                id="vector"
                name="vector"
                className="block w-full pl-10 pr-8 py-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-sm text-[#281813] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200 cursor-pointer appearance-none"
                defaultValue="electricity"
              >
                <option value="electricity">Electricidad</option>
                <option value="gas">Gas</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#64748b]/70">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Power Input */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="power">
              Potencia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.69c.04.87-.1 1.76-.41 2.59-.47 1.25-1.31 2.33-2.31 3.22C7.23 10.36 5.86 12.87 6 15.65c.13 2.76 2.02 5.09 4.7 5.76.62.15 1.25.21 1.88.21s1.26-.06 1.88-.21c2.68-.67 4.57-3 4.7-5.76.14-2.78-1.23-5.29-3.28-7.15-1-1-1.84-2.07-2.31-3.22-.31-.83-.45-1.72-.41-2.59zM12 18c-1.66 0-3-1.34-3-3 0-1.32.74-2.46 1.84-3.03.46-.24.95-.45 1.16-.97.21.52.7.73 1.16.97C14.26 12.54 15 13.68 15 15c0 1.66-1.34 3-3 3z" />
                </svg>
              </div>
              <input
                type="number"
                step="0.001"
                min="0.001"
                id="power"
                name="power"
                required
                placeholder="0.000"
                className="block w-full pl-10 pr-3 py-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-sm text-[#281813] placeholder:text-[#64748b]/50 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Hours per Day Input */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="hoursPerDay">
              Horas/día
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                defaultValue="8"
                id="hoursPerDay"
                name="hoursPerDay"
                className="block w-full pl-10 pr-3 py-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-sm text-[#281813] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Days per Month Input */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="daysPerMonth">
              Días/mes
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b]">
                <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5H7v2h5v-2zm4 0h-3v2h3v-2zm-4 4H7v2h5v-2zm4 0h-3v2h3v-2z" />
                </svg>
              </div>
              <input
                type="number"
                min="0"
                max="31"
                defaultValue="22"
                id="daysPerMonth"
                name="daysPerMonth"
                className="block w-full pl-10 pr-3 py-3 border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-sm text-[#281813] focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Submit Button & Error */}
          <div className="sm:col-span-6 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium flex items-center gap-2">
                  <svg className="w-5 h-5 select-none text-destructive" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {error}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex justify-center items-center py-2.5 px-6 rounded-full text-sm font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0ea5e9] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-sm"
            >
              {loading ? "Agregando…" : "+ Agregar equipo"}
            </button>
          </div>
        </form>
      </div>

      {initial.length === 0 ? (
        <p className="text-sm text-[#8A726B] font-medium pl-2">Aún no hay equipos cargados.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[#f8fafc] text-left text-[#64748b] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-xs">Equipo</th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-xs">Vector</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Potencia</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">h/día</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">días/mes</th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-xs">Consumo/mes</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {initial.map((e) => (
                <tr key={e.id} className="border-t border-[#e2e8f0]/40 hover:bg-[#f8fafc] transition-colors">
                  <td className="px-5 py-3 font-bold text-[#281813]">{e.name}</td>
                  <td className="px-5 py-3 text-[#64748b] font-medium">{VECTOR_LABEL[e.vector]}</td>
                  <td className="px-5 py-3 text-right text-[#64748b] font-semibold">{Number(e.power)}</td>
                  <td className="px-5 py-3 text-right text-[#64748b] font-semibold">{Number(e.hoursPerDay)}</td>
                  <td className="px-5 py-3 text-right text-[#64748b] font-semibold">{e.daysPerMonth}</td>
                  <td className="px-5 py-3 text-right text-[#281813] font-bold">
                    {formatNumber(e.monthlyConsumption)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => remove(e.id)}
                      className="text-xs font-bold text-destructive hover:text-red-700 hover:underline transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
