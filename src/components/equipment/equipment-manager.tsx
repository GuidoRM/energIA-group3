"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={add} className="grid items-end gap-3 sm:grid-cols-6">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="name">Equipo</Label>
              <Input id="name" name="name" required placeholder="Horno" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="vector">Vector</Label>
              <select
                id="vector"
                name="vector"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-2 text-sm"
                defaultValue="electricity"
              >
                <option value="electricity">Electricidad</option>
                <option value="gas">Gas</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="power">Potencia</Label>
              <Input id="power" name="power" type="number" step="0.001" min="0.001" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hoursPerDay">Horas/día</Label>
              <Input id="hoursPerDay" name="hoursPerDay" type="number" step="0.5" min="0" max="24" defaultValue="8" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="daysPerMonth">Días/mes</Label>
              <Input id="daysPerMonth" name="daysPerMonth" type="number" min="0" max="31" defaultValue="22" />
            </div>
            <div className="sm:col-span-6">
              {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Agregando…" : "+ Agregar equipo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {initial.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay equipos cargados.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Equipo</th>
                <th className="px-4 py-2 font-medium">Vector</th>
                <th className="px-4 py-2 text-right font-medium">Potencia</th>
                <th className="px-4 py-2 text-right font-medium">h/día</th>
                <th className="px-4 py-2 text-right font-medium">días/mes</th>
                <th className="px-4 py-2 text-right font-medium">Consumo/mes</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {initial.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2">{VECTOR_LABEL[e.vector]}</td>
                  <td className="px-4 py-2 text-right">{Number(e.power)}</td>
                  <td className="px-4 py-2 text-right">{Number(e.hoursPerDay)}</td>
                  <td className="px-4 py-2 text-right">{e.daysPerMonth}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatNumber(e.monthlyConsumption)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => remove(e.id)}
                      className="text-xs text-destructive hover:underline"
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
