import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import {
  getComplianceHealth,
  listGovernanceAuditEvents,
} from "@/lib/governance/audit/repository";
import { ComplianceHealthCard } from "@/components/governance/audit/ComplianceHealthCard";
import { GovernanceAuditTable } from "@/components/governance/audit/GovernanceAuditTable";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";
import { AuditDepartmentFilter } from "@/components/governance/audit/AuditDepartmentFilter";
import { AuditCategoryFilter } from "@/components/governance/audit/AuditCategoryFilter";
import { SecurityIncidentCard } from "@/components/governance/audit/SecurityIncidentCard";
import { AuditRealtimeBridge } from "@/components/governance/audit/AuditRealtimeBridge";
import type { GovernanceAuditCategory, GovernanceAuditSeverity } from "@/lib/governance/audit/types";
import { AUDIT_SEVERITIES, severityTranslationKey } from "@/lib/i18n/statuses";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";

type PageProps = {
  searchParams?: {
    page?: string;
    pageSize?: "10" | "25" | "50";
    category?: string;
    severity?: string;
    department?: string;
    actorUserId?: string;
    q?: string;
  };
};

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const page = Number(searchParams?.page ?? "1");
  const pageSize = (searchParams?.pageSize ?? "25") as "10" | "25" | "50";
  const category = (searchParams?.category ?? "") as GovernanceAuditCategory | "";
  const severity = (searchParams?.severity ?? "") as GovernanceAuditSeverity | "";
  const department = searchParams?.department ?? "";
  const actorUserId = searchParams?.actorUserId ?? "";
  const q = searchParams?.q ?? "";

  const [result, compliance, locale] = await Promise.all([
    listGovernanceAuditEvents({
      page,
      pageSize: Number(pageSize) as 10 | 25 | 50,
      category: category || undefined,
      severity: severity || undefined,
      departmentKey: department || undefined,
      actorUserId: actorUserId || undefined,
      query: q || undefined,
    }),
    getComplianceHealth(),
    getRequestLocale(),
  ]);
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);

  const departmentOptions = Array.from(
    new Set(result.data.map((e) => e.departmentKey).filter((v): v is string => Boolean(v))),
  ).sort();
  const securityIncidents = result.data.filter((e) => e.severity === "security").slice(0, 5);

  const buildUrl = (nextPage: number) => {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    p.set("pageSize", String(result.pageSize));
    if (category) p.set("category", category);
    if (severity) p.set("severity", severity);
    if (department) p.set("department", department);
    if (actorUserId) p.set("actorUserId", actorUserId);
    if (q) p.set("q", q);
    return `/admin/audit?${p.toString()}`;
  };

  return (
    <div className="page-wrapper mx-auto max-w-6xl space-y-5">
      <AuditRealtimeBridge />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Centre d&apos;audit entreprise</h1>
        <p className="mt-1 text-sm text-gray-600">
          Traceabilite gouvernance, supervision compliance et visibilite securite.
        </p>
      </section>

      <ComplianceHealthCard
        criticalEvents7d={compliance.criticalEvents7d}
        securityEvents7d={compliance.securityEvents7d}
        unresolvedAlerts={compliance.unresolvedAlerts}
      />

      <FilterPanelShell>
      <form className="flex flex-wrap items-center gap-2" method="get">
        <AuditCategoryFilter selected={category} />
        <select
          name="severity"
          defaultValue={severity}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("governance.audit.filters.allSeverities")}</option>
          {AUDIT_SEVERITIES.map((auditSeverity) => (
            <option key={auditSeverity} value={auditSeverity}>
              {t(severityTranslationKey(auditSeverity))}
            </option>
          ))}
        </select>
        <AuditDepartmentFilter options={departmentOptions} selected={department} />
        <input
          name="actorUserId"
          defaultValue={actorUserId}
          placeholder={t("governance.audit.filters.actorUserId")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder={t("governance.audit.filters.actionSearch")}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
        >
          Filtrer
        </button>
      </form>
      </FilterPanelShell>

      {securityIncidents.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Incidents securite</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {securityIncidents.map((event) => (
              <SecurityIncidentCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ) : null}

      <GovernanceAuditTable events={result.data} />

      <PaginationBar page={result.page} totalPages={result.totalPages} buildHref={buildUrl} />
    </div>
  );
}
