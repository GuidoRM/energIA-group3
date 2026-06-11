/** Formateadores compartidos (es-AR). */

const numberFmt = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const currencyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatNumber(value: number | string): string {
  return numberFmt.format(Number(value));
}

export function formatCurrency(value: number | string): string {
  return currencyFmt.format(Number(value));
}

export function formatPct(value: number | string): string {
  const n = Number(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? String(month);
}

export const LOCATION_LABEL: Record<string, string> = {
  ushuaia: "Ushuaia",
  rio_grande: "Río Grande",
  tolhuin: "Tolhuin",
};

export const STAGE_LABEL: Record<string, string> = {
  identity: "Identidad",
  equipment: "Equipos",
  operation: "Operación",
  tariffs: "Tarifas",
  complete: "Completo",
};

export const VECTOR_LABEL: Record<string, string> = {
  gas: "Gas",
  electricity: "Electricidad",
};
