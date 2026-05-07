import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { listGovernanceAlerts } from "@/lib/governance/alerts/repository";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { AlertsRealtimeBridge } from "@/components/governance/alerts/AlertsRealtimeBridge";
import { CriticalAlertBanner } from "@/components/governance/alerts/CriticalAlertBanner";
import { GovernanceAlertTable } from "@/components/governance/alerts/GovernanceAlertTable";
import { AlertDepartmentFilter } from "@/components/governance/alerts/AlertDepartmentFilter";
import { acknowledgeAlertAction, resolveAlertAction } from "./actions";
import type { GovernanceAlertSeverity, GovernanceAlertStatus } from "@/lib/governance/alerts/types";

type PageProps = {
  searchParams?: {
    status?: string;
    severity?: string;
    department?: string;
  };
};

export default async function AdminAlertsPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const status = (searchParams?.status ?? "") as GovernanceAlertStatus | "";
  const severity = (searchParams?.severity ?? "") as GovernanceAlertSeverity | "";
  const department = searchParams?.department ?? "";
  const alerts = await listGovernanceAlerts({
    status: status || undefined,
    severity: severity || undefined,
    departmentKey: department || undefined,
    limit: 150,
  });
  const departmentOptions = Array.from(
    new Set(alerts.map((a) => a.departmentKey).filter((v): v is string => Boolean(v))),
  ).sort();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <AlertsRealtimeBridge />
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/alerts", label: "Centre d'alertes" },
        ]}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Centre d&apos;alertes gouvernance</h1>
        <p className="mt-1 text-sm text-gray-600">
          Supervision realtime des incidents critiques, anomalies et signaux gouvernance.
        </p>
      </section>

      <CriticalAlertBanner alerts={alerts} />

      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <select
          name="status"
          defaultValue={status}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="unread">unread</option>
          <option value="acknowledged">acknowledged</option>
          <option value="resolved">resolved</option>
        </select>
        <select
          name="severity"
          defaultValue={severity}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Toutes severites</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="critical">critical</option>
        </select>
        <AlertDepartmentFilter options={departmentOptions} selected={department} />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
        >
          Filtrer
        </button>
      </form>

      <GovernanceAlertTable
        alerts={alerts}
        renderActions={(alert) =>
          alert.status !== "resolved" ? (
            <form
              action={async (formData) => {
                "use server";
                const action = String(formData.get("decision") ?? "");
                const alertId = String(formData.get("alertId") ?? "");
                if (action === "ack") {
                  await acknowledgeAlertAction(alertId);
                  return;
                }
                await resolveAlertAction(alertId);
              }}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="alertId" value={alert.id} />
              <button
                type="submit"
                name="decision"
                value="ack"
                className="rounded-lg bg-amber-600 px-2 py-1 text-xs text-white"
              >
                Acknowledge
              </button>
              <button
                type="submit"
                name="decision"
                value="resolve"
                className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
              >
                Resolve
              </button>
            </form>
          ) : null
        }
      />
    </div>
  );
}
