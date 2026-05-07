import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import {
  getComplianceHealth,
  listGovernanceAuditEvents,
} from "@/lib/governance/audit/repository";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { ComplianceHealthCard } from "@/components/governance/audit/ComplianceHealthCard";
import { GovernanceAuditTable } from "@/components/governance/audit/GovernanceAuditTable";
import { AuditDepartmentFilter } from "@/components/governance/audit/AuditDepartmentFilter";
import { AuditCategoryFilter } from "@/components/governance/audit/AuditCategoryFilter";
import { SecurityIncidentCard } from "@/components/governance/audit/SecurityIncidentCard";
import { AuditRealtimeBridge } from "@/components/governance/audit/AuditRealtimeBridge";
import type { GovernanceAuditCategory, GovernanceAuditSeverity } from "@/lib/governance/audit/types";

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

  const [result, compliance] = await Promise.all([
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
  ]);

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
    <div className="mx-auto max-w-6xl space-y-5">
      <AuditRealtimeBridge />
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/audit", label: "Centre d'audit" },
        ]}
      />
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

      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <AuditCategoryFilter selected={category} />
        <select
          name="severity"
          defaultValue={severity}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Toutes severites</option>
          <option value="informational">informational</option>
          <option value="warning">warning</option>
          <option value="critical">critical</option>
          <option value="security">security</option>
        </select>
        <AuditDepartmentFilter options={departmentOptions} selected={department} />
        <input
          name="actorUserId"
          defaultValue={actorUserId}
          placeholder="Actor user id"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Action search"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
        >
          Filtrer
        </button>
      </form>

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

      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
        <p>
          Page {result.page} / {result.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={result.page > 1 ? buildUrl(result.page - 1) : "#"}
            className={`rounded-lg border px-3 py-1.5 ${
              result.page > 1 ? "border-gray-300 text-gray-800" : "border-gray-100 text-gray-300"
            }`}
          >
            Precedent
          </a>
          <a
            href={result.page < result.totalPages ? buildUrl(result.page + 1) : "#"}
            className={`rounded-lg border px-3 py-1.5 ${
              result.page < result.totalPages ? "border-gray-300 text-gray-800" : "border-gray-100 text-gray-300"
            }`}
          >
            Suivant
          </a>
        </div>
      </div>
    </div>
  );
}
