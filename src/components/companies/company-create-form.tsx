"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/client";

const LOCATIONS = [
  { value: "rio_grande", label: "Río Grande" },
  { value: "ushuaia", label: "Ushuaia" },
  { value: "tolhuin", label: "Tolhuin" },
];

export function CompanyCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const gas = form.get("gasTariff");
    const elec = form.get("electricityTariff");
    const body: Record<string, unknown> = {
      name: String(form.get("name")),
      location: String(form.get("location")),
    };
    const industry = String(form.get("industry") ?? "");
    if (industry) body.industry = industry;
    if (gas) body.gasTariff = Number(gas);
    if (elec) body.electricityTariff = Number(elec);

    try {
      await apiFetch("/api/companies", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 py-3 px-6 rounded-full text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FD5212] transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Nueva empresa
      </button>
    );
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#e5beb3] p-6 sm:p-8 w-full shadow-sm mb-6 animate-fadeIn">
      <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
        {/* Name Input */}
        <div className="space-y-2 sm:col-span-2">
          <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="name">
            Nombre de la empresa
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
              <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
              </svg>
            </div>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ej: Austral Energy"
              required
              className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Industry Input */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="industry">
            Rubro / Actividad
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
              <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
              </svg>
            </div>
            <input
              type="text"
              id="industry"
              name="industry"
              placeholder="Ej: Metalúrgica"
              className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Location Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="location">
            Localidad
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
              <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <select
              id="location"
              name="location"
              className="block w-full pl-10 pr-8 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200 cursor-pointer appearance-none"
              defaultValue="rio_grande"
            >
              {LOCATIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#5c4038]/70">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Gas Tariff Input */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="gasTariff">
            Tarifa gas ($/m³)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
              <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.69c.04.87-.1 1.76-.41 2.59-.47 1.25-1.31 2.33-2.31 3.22C7.23 10.36 5.86 12.87 6 15.65c.13 2.76 2.02 5.09 4.7 5.76.62.15 1.25.21 1.88.21s1.26-.06 1.88-.21c2.68-.67 4.57-3 4.7-5.76.14-2.78-1.23-5.29-3.28-7.15-1-1-1.84-2.07-2.31-3.22-.31-.83-.45-1.72-.41-2.59zM12 18c-1.66 0-3-1.34-3-3 0-1.32.74-2.46 1.84-3.03.46-.24.95-.45 1.16-.97.21.52.7.73 1.16.97C14.26 12.54 15 13.68 15 15c0 1.66-1.34 3-3 3z" />
              </svg>
            </div>
            <input
              type="number"
              step="0.0001"
              min="0"
              id="gasTariff"
              name="gasTariff"
              placeholder="0.0000"
              className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Electricity Tariff Input */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider" htmlFor="electricityTariff">
            Tarifa luz ($/kWh)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5c4038]">
              <svg className="w-5 h-5 select-none" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 21v-9H5L13 3v9h6L11 21z" />
              </svg>
            </div>
            <input
              type="number"
              step="0.0001"
              min="0"
              id="electricityTariff"
              name="electricityTariff"
              placeholder="0.0000"
              className="block w-full pl-10 pr-3 py-3 border border-[#e5beb3] rounded-lg bg-[#fff8f6] text-sm text-[#281813] placeholder:text-[#5c4038]/50 focus:outline-none focus:ring-2 focus:ring-[#FD5212] focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium flex items-center gap-2 sm:col-span-2">
            <svg className="w-5 h-5 select-none text-destructive" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}

        {/* Actions buttons */}
        <div className="flex flex-wrap gap-3 sm:col-span-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex justify-center items-center py-2.5 px-6 rounded-full text-sm font-bold text-white bg-[#FD5212] hover:bg-[#e0450b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FD5212] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? "Creando…" : "Crear empresa"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex justify-center items-center py-2.5 px-6 rounded-full text-sm font-bold text-[#8A726B] bg-transparent hover:bg-[#FBF8F5] border border-[#d2baa9] focus:outline-none transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
