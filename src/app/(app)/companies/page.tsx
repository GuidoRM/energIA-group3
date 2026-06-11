import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { CompanyCreateForm } from "@/components/companies/company-create-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireSession } from "@/lib/auth";
import { LOCATION_LABEL, STAGE_LABEL } from "@/lib/format";
import { companyService } from "@/services/company.service";

/** RF3.1 — Server Component que lee los services directamente (§7). */
export default async function CompaniesPage() {
  const session = await requireSession();
  const companies = await companyService.listByOrg(session.organizationId);

  return (
    <>
      <PageHeader title="Empresas" description="Gemelos digitales de tu organización" />
      <div className="space-y-6 p-8">
        <CompanyCreateForm />

        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay empresas. Creá la primera para empezar el onboarding.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{c.name}</CardTitle>
                      <Badge variant="secondary">
                        {STAGE_LABEL[c.onboardingStage]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {c.industry ?? "Sin rubro"} · {LOCATION_LABEL[c.location]}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Perfil</span>
                      <span>{c.profileCompletion}%</span>
                    </div>
                    <Progress value={c.profileCompletion} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
