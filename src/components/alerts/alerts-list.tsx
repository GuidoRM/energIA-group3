"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/client";
import type { Alert } from "@/lib/types";

// ─── Config tables ────────────────────────────────────────────────────────────

const SEV = {
  high: {
    label: "Alta",
    dot: "bg-[#ef4444]",
    bar: "bg-[#ef4444]",
    badge: "bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]",
  },
  medium: {
    label: "Media",
    dot: "bg-[#f59e0b]",
    bar: "bg-[#f59e0b]",
    badge: "bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]",
  },
  low: {
    label: "Baja",
    dot: "bg-[#3b82f6]",
    bar: "bg-[#3b82f6]",
    badge: "bg-[#eff6ff] text-[#1d4ed8] border border-[#93c5fd]",
  },
} as const;

const TYPE_LABEL: Record<Alert["type"], string> = {
  consumption_spike: "Pico de consumo",
  cost_spike: "Pico de costo",
  anomaly: "Anomalía",
};

const TYPE_ICON: Record<Alert["type"], React.ReactNode> = {
  consumption_spike: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 21v-9H5L13 3v9h6L11 21z" />
    </svg>
  ),
  cost_spike: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  anomaly: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const RECOMMENDATIONS: Record<Alert["type"], string[]> = {
  consumption_spike: [
    "Revisar el aislamiento térmico de la nave para reducir pérdidas de calor en períodos fríos.",
    "Escalonar el encendido de equipos de alta demanda para evitar picos simultáneos.",
    "Evaluar la incorporación de un sistema de recuperación de calor residual en el horno industrial.",
  ],
  cost_spike: [
    "Solicitar cotización de contratos de abastecimiento con precios estacionales fijos.",
    "Analizar el desplazamiento de cargas no críticas a horarios de tarifa reducida.",
    "Revisar la eficiencia de los equipos de mayor consumo y planificar su recambio si superan 10 años.",
  ],
  anomaly: [
    "Realizar inspección visual de la red de distribución (neumática, eléctrica o de gas).",
    "Programar mantenimiento preventivo del equipo asociado para descartar fugas o desgaste.",
    "Comparar el consumo real vs. el modelo para confirmar si la desviación persiste en el próximo período.",
  ],
};

type FilterKey = "all" | "unread" | "high" | "medium" | "low";

// ─── Component ────────────────────────────────────────────────────────────────

export function AlertsList({ initial }: { initial: Alert[] }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>(initial);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState<Set<string>>(new Set());

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  const filtered = alerts.filter((a) => {
    if (filter === "unread") return !a.isRead;
    if (filter === "high") return a.severity === "high";
    if (filter === "medium") return a.severity === "medium";
    if (filter === "low") return a.severity === "low";
    return true;
  });

  async function markRead(id: string) {
    setMarking((s) => new Set(s).add(id));
    await apiFetch(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    setMarking((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
    router.refresh();
  }

  function toggleExpand(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function formatDate(date: Date | string) {
    return new Date(date).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Todas", count: alerts.length },
    { key: "unread", label: "No leídas", count: unreadCount },
    { key: "high", label: "Alta", count: highCount },
    { key: "medium", label: "Media", count: mediumCount },
    { key: "low", label: "Baja", count: lowCount },
  ];

  return (
    <div className="space-y-5">
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total alertas" value={alerts.length} sub={`${unreadCount} sin leer`} accent="#64748b" />
        <StatCard label="Prioridad alta" value={highCount} sub="Requieren atención" accent="#ef4444" dotColor="bg-[#ef4444]" />
        <StatCard label="Prioridad media" value={mediumCount} sub="Revisar pronto" accent="#f59e0b" dotColor="bg-[#f59e0b]" />
        <StatCard label="Informativas" value={lowCount} sub="Baja prioridad" accent="#3b82f6" dotColor="bg-[#3b82f6]" />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
              filter === f.key
                ? "border-[#0ea5e9] bg-[#0ea5e9] text-white shadow-sm shadow-[#0ea5e9]/30"
                : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1] hover:text-[#0f172a]",
            )}
          >
            {f.label}
            <span
              className={cn(
                "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                filter === f.key ? "bg-white/25 text-white" : "bg-[#f1f5f9] text-[#64748b]",
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#e2e8f0] py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8fafc] text-[#94a3b8]">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#64748b]">Sin alertas en esta categoría</p>
          <p className="text-xs text-[#94a3b8]">
            Las alertas aparecen cuando se proyectan consumos fuera del umbral.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const sev = SEV[a.severity];
            const isExpanded = expanded.has(a.id);
            const isMarking = marking.has(a.id);
            const recs = RECOMMENDATIONS[a.type];

            return (
              <div
                key={a.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200",
                  a.isRead
                    ? "border-[#e2e8f0] opacity-70 hover:opacity-100"
                    : "border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1]",
                )}
              >
                {/* Left severity bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl", sev.bar)} />

                <div className="pl-5 pr-4 pt-4 pb-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Severity badge */}
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", sev.badge)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", sev.dot)} />
                        {sev.label}
                      </span>

                      {/* Type chip */}
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[11px] font-semibold text-[#64748b]">
                        {TYPE_ICON[a.type]}
                        {TYPE_LABEL[a.type]}
                      </span>

                      {/* Unread indicator */}
                      {!a.isRead && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#0ea5e9]/20 bg-[#0ea5e9]/10 px-2 py-0.5 text-[11px] font-bold text-[#0284c7]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0ea5e9]" />
                          Nueva
                        </span>
                      )}
                    </div>

                    {/* Date + mark-read */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-[#94a3b8]">{formatDate(a.createdAt)}</span>
                      {!a.isRead && (
                        <button
                          onClick={() => markRead(a.id)}
                          disabled={isMarking}
                          title="Marcar como leída"
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#0ea5e9] disabled:opacity-50"
                        >
                          {isMarking ? (
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="mt-2.5 text-sm leading-relaxed text-[#334155]">{a.message}</p>

                  {/* Expand toggle */}
                  <button
                    onClick={() => toggleExpand(a.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0ea5e9] transition-colors hover:text-[#0284c7]"
                  >
                    <svg
                      className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    {isExpanded ? "Ocultar recomendaciones" : "Ver recomendaciones"}
                  </button>

                  {/* Recommendations panel */}
                  {isExpanded && (
                    <div className="mt-3 rounded-xl border border-[#e0f2fe] bg-[#f0f9ff] p-3.5">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#0369a1]">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
                        </svg>
                        Recomendaciones del Copiloto Energético
                      </p>
                      <ul className="space-y-2">
                        {recs.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#0369a1]">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0ea5e9]/20 text-[9px] font-bold text-[#0284c7]">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
  dotColor,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
  dotColor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div
        className="absolute right-0 top-0 h-16 w-16 rounded-bl-full opacity-5"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-[#64748b]">{label}</p>
        {dotColor && <span className={cn("mt-0.5 h-2 w-2 rounded-full", dotColor)} />}
      </div>
      <p className="mt-1.5 text-2xl font-black text-[#0f172a]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#94a3b8]">{sub}</p>
    </div>
  );
}
