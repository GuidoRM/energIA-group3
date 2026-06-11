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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#fff8f6] border border-[#e5beb3] rounded-xl p-3 shadow-md text-xs font-semibold font-sans">
        <p className="text-[#8A726B] mb-1 font-bold text-[10px] uppercase tracking-wider">{label}</p>
        <p className="text-[#281813] font-bold">
          Temp. media: <span className="text-[#FD5212] font-extrabold text-sm">{Number(payload[0].value)} °C</span>
        </p>
      </div>
    );
  }
  return null;
};

/** RF5.3 — relación clima↔consumo (serie de temperatura media). */
export function ClimateChart({ series }: { series: MonthlyClimate[] }) {
  const data = series.map((row) => ({
    label: `${monthName(row.month)} ${String(row.year).slice(2)}`,
    temp: Number(row.meanTemp),
  }));

  return (
    <div className="h-80 w-full font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d2baa9" strokeOpacity={0.3} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#8A726B", fontFamily: "var(--font-sans), sans-serif", fontWeight: 500 }}
            interval="preserveStartEnd"
            stroke="#d2baa9"
            strokeOpacity={0.5}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8A726B", fontFamily: "var(--font-sans), sans-serif", fontWeight: 500 }}
            unit="°"
            stroke="#d2baa9"
            strokeOpacity={0.5}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#FD5212"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#FD5212", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
