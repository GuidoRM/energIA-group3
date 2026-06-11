"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    return <Button onClick={() => setOpen(true)}>+ Nueva empresa</Button>;
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Rubro</Label>
            <Input id="industry" name="industry" placeholder="Metalúrgica" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Localidad</Label>
            <select
              id="location"
              name="location"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              defaultValue="rio_grande"
            >
              {LOCATIONS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gasTariff">Tarifa gas ($/m³)</Label>
            <Input id="gasTariff" name="gasTariff" type="number" step="0.0001" min="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="electricityTariff">Tarifa luz ($/kWh)</Label>
            <Input id="electricityTariff" name="electricityTariff" type="number" step="0.0001" min="0" />
          </div>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creando…" : "Crear"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
