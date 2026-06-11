import Link from "next/link";

import { PageHeader } from "@/components/app/page-header";
import { CompanyCreateForm } from "@/components/companies/company-create-form";
import { requireSession } from "@/lib/auth";
import { LOCATION_LABEL, STAGE_LABEL } from "@/lib/format";
import { companyService } from "@/services/company.service";

export default async function CompaniesPage() {
  const session = await requireSession();
  const companies = await companyService.listByOrg(session.organizationId);

  return (
    <>
      <PageHeader title="Empresas" description="Gemelos digitales de tu organización" />
      <div className="space-y-6 p-6 sm:p-8">
        <CompanyCreateForm />

        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f5f9] mb-4">
              <svg className="h-8 w-8 text-[#94a3b8]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-[#0f172a]">Todavía no hay empresas</p>
            <p className="mt-1 text-sm text-[#64748b]">Creá la primera para empezar el onboarding.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c.id} href={`/companies/${c.id}`} className="group block">
                <div className="relative h-full overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm transition-all duration-200 group-hover:border-[#0ea5e9]/40 group-hover:shadow-md group-hover:-translate-y-0.5">
                  {/* Cyan top accent line on hover */}
                  <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-[#FD5212] to-[#0ea5e9] transition-transform duration-300 group-hover:scale-x-100 rounded-t-2xl" />

                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-[#0f172a] group-hover:text-[#FD5212] transition-colors leading-tight">
                        {c.name}
                      </h3>
                      <span className="shrink-0 inline-flex items-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] px-2.5 py-0.5 text-xs font-bold">
                        {STAGE_LABEL[c.onboardingStage]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      {c.industry ?? "Sin rubro"} · {LOCATION_LABEL[c.location]}
                    </p>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-[#64748b]">
                        <span>Perfil del gemelo</span>
                        <span className={c.profileCompletion === 100 ? "text-[#0ea5e9]" : "text-[#FD5212]"}>
                          {c.profileCompletion}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${c.profileCompletion}%`,
                            background: c.profileCompletion === 100
                              ? "#0ea5e9"
                              : "linear-gradient(to right, #FD5212, #fb923c)",
                          }}
                        />
                      </div>
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
