import { notFound } from "next/navigation";

import { ClimateChart } from "@/components/charts/climate-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { LOCATION_LABEL, monthName } from "@/lib/format";
import { climateService } from "@/services/climate.service";
import { companyService } from "@/services/company.service";

/** RF5.1–5.3 — dashboard de clima de la localidad de la empresa. */
export default async function ClimatePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  const session = await requireSession();
  const company = await companyService
    .getForOrg(companyId, session.organizationId)
    .catch(() => null);
  if (!company) notFound();

  const currentMonth = new Date().getMonth() + 1;
  const [series, forecast] = await Promise.all([
    climateService.getSeries(company.location),
    climateService.forecastTempFor(company.location, currentMonth),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Localidad</p>
            <p className="mt-1 text-2xl font-bold">
              {LOCATION_LABEL[company.location]}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Temp. prevista — {monthName(currentMonth)}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {forecast !== null ? `${forecast} °C` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temperatura media mensual (IPIEC)</CardTitle>
        </CardHeader>
        <CardContent>
          {series.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay datos de clima. Corré <code>npm run db:seed</code>.
            </p>
          ) : (
            <ClimateChart series={series} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
