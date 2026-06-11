import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { CompanyCreateForm } from "@/components/companies/company-create-form";
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
      <div className="space-y-6 p-6 sm:p-8">
        <CompanyCreateForm />

        {companies.length === 0 ? (
          <p className="text-sm text-[#8A726B] font-medium">
            Todavía no hay empresas. Creá la primera para empezar el onboarding.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`} className="group block">
                <div className="bg-[#E8D7CA] rounded-2xl border border-[#d2baa9] p-6 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:border-[#FD5212]/50 group-hover:-translate-y-0.5 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-[#281813] group-hover:text-[#FD5212] transition-colors leading-tight">
                        {c.name}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-[#C15735] text-white px-2.5 py-0.5 text-xs font-semibold select-none shadow-sm">
                        {STAGE_LABEL[c.onboardingStage]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#8A726B] tracking-wide uppercase">
                      {c.industry ?? "Sin rubro"} · {LOCATION_LABEL[c.location]}
                    </p>
                  </div>
                  
                  {/* Completion profile progress */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs text-[#8A726B] font-bold">
                      <span>Perfil</span>
                      <span>{c.profileCompletion}%</span>
                    </div>
                    {/* Custom premium styled progress bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#FBF8F5] border border-[#d2baa9]/40" role="progressbar" aria-valuenow={c.profileCompletion} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className="h-full rounded-full bg-[#FD5212] transition-all duration-500"
                        style={{ width: `${c.profileCompletion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
