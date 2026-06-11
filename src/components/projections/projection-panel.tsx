"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Card>
        <CardHeader>
          <CardTitle>Generar proyección</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generate} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="forecastTemp">Temperatura prevista (°C)</Label>
              <Input
                id="forecastTemp"
                name="forecastTemp"
                type="number"
                step="0.1"
                defaultValue={suggestedTemp ?? undefined}
                placeholder="promedio histórico"
                className="w-48"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Calculando…" : "Calcular"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay proyecciones. Generá la primera.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Período</th>
                <th className="px-4 py-2 text-right font-medium">Temp.</th>
                <th className="px-4 py-2 text-right font-medium">Consumo</th>
                <th className="px-4 py-2 text-right font-medium">Costo</th>
                <th className="px-4 py-2 text-right font-medium">Variación</th>
              </tr>
            </thead>
            <tbody>
              {initial.map((p) => {
                const variation = Number(p.variationPct ?? 0);
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">
                      {monthName(p.month)} {p.year}
                    </td>
                    <td className="px-4 py-2 text-right">{Number(p.forecastTemp)}°</td>
                    <td className="px-4 py-2 text-right">
                      {formatNumber(p.estimatedConsumption)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatCurrency(p.estimatedCost)}
                    </td>
                    <td
                      className={
                        "px-4 py-2 text-right font-medium " +
                        (variation > 0 ? "text-destructive" : "text-accent")
                      }
                    >
                      {formatPct(variation)}
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
