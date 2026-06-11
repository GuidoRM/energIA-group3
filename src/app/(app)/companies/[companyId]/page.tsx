import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPct, monthName } from "@/lib/format";
import { alertService } from "@/services/alert.service";
import { equipmentService } from "@/services/equipment.service";
import { projectionService } from "@/services/projection.service";

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const [equipment, projections, unread] = await Promise.all([
    equipmentService.listByCompany(companyId),
    projectionService.listByCompany(companyId),
    alertService.countUnread(companyId),
  ]);

  const baseConsumption = equipment.reduce(
    (sum, e) => sum + e.monthlyConsumption,
    0,
  );
  const latest = projections[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Equipos" value={String(equipment.length)} />
        <Metric label="Consumo base / mes" value={formatNumber(baseConsumption)} />
        <Metric
          label="Última proyección"
          value={latest ? formatCurrency(latest.estimatedCost) : "—"}
          sub={
            latest
              ? `${monthName(latest.month)} · ${formatPct(latest.variationPct ?? 0)}`
              : "Sin proyecciones"
          }
        />
        <Metric label="Alertas sin leer" value={String(unread)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos pasos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <Link className="text-primary hover:underline" href={`/companies/${companyId}/equipment`}>
            Cargar equipos →
          </Link>
          <Link className="text-primary hover:underline" href={`/companies/${companyId}/projections`}>
            Generar proyección →
          </Link>
          <Link className="text-primary hover:underline" href={`/companies/${companyId}/agent`}>
            Hablar con Hermes →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
