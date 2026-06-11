"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { monthName } from "@/lib/format";
import type { MonthlyClimate } from "@/lib/types";

/** RF5.3 — relación clima↔consumo (serie de temperatura media). */
export function ClimateChart({ series }: { series: MonthlyClimate[] }) {
  const data = series.map((row) => ({
    label: `${monthName(row.month)} ${String(row.year).slice(2)}`,
    temp: Number(row.meanTemp),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            unit="°"
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) => [`${Number(v)} °C`, "Temp. media"]}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
