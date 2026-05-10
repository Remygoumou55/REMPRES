import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, ClipboardCheck, ShieldCheck, UserCheck, UserMinus, Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { getRhFoundationData } from "@/lib/server/rh-foundation";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";
import { getRequestLocale } from "@/lib/i18n/request-locale";

function badgeTone(active: boolean): string {
  return active
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-red-50 text-red-700 border-red-200";
}

export default async function RHPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["rh"]);
  if (!perms.canRead) redirect("/access-denied");

  const [{ messages }, data] = await Promise.all([
    loadLocaleMessages(getRequestLocale()),
    getRhFoundationData(user.id),
  ]);
  const t = (key: string, fallback?: string) => translateFromDict(messages, key, fallback);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title={t("dashboard.rh.title", "Ressources Humaines")}
        subtitle={t(
          "dashboard.rh.subtitle",
          "Pilotage RH centralise : effectifs, activite, alertes et conformite",
        )}
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            {t("dashboard.rh.lastSync", "Derniere synchronisation")}{" "}
            {formatDistanceToNow(new Date(data.generatedAt), { addSuffix: true, locale: fr })}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/rh/collaborateurs"
          className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-darktext">Collaborateurs</p>
          <p className="mt-1 text-xs text-gray-500">Annuaire RH et statut des profils</p>
        </Link>
        <Link
          href="/rh/presences"
          className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-darktext">Presences</p>
          <p className="mt-1 text-xs text-gray-500">Suivi des effectifs actifs et disponibilite equipe</p>
        </Link>
        <Link
          href="/rh/conges"
          className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-darktext">Conges</p>
          <p className="mt-1 text-xs text-gray-500">Demandes de conges et validation RH</p>
        </Link>
        <Link
          href="/rh/contrats"
          className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-darktext">Contrats</p>
          <p className="mt-1 text-xs text-gray-500">Gestion enterprise des contrats, renouvellements et alertes</p>
        </Link>
        <Link
          href="/rh/recrutement"
          className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-darktext">Recrutement</p>
          <p className="mt-1 text-xs text-gray-500">ATS candidats, pipeline, entretiens, onboarding et gouvernance</p>
        </Link>
        <a
          href="/api/rh/export?format=csv"
          className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40"
        >
          <p className="text-sm font-semibold text-darktext">Export RH</p>
          <p className="mt-1 text-xs text-gray-500">Export CSV conges + presences + indicateurs</p>
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title={t("dashboard.rh.kpi.activeEmployees", "Collaborateurs actifs")}
          value={data.activeEmployees}
          subtitle={t("dashboard.rh.kpi.globalScope", "Perimetre entreprise")}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.inactiveEmployees", "Collaborateurs inactifs")}
          value={data.inactiveEmployees}
          subtitle={t("dashboard.rh.kpi.followupRequired", "Suivi RH requis")}
          icon={UserMinus}
          color="red"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.activeRhTeam", "Equipe RH active")}
          value={data.activeRhTeam}
          subtitle={t("dashboard.rh.kpi.departmentScope", "Departement RH")}
          icon={UserCheck}
          color="purple"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.newHires30d", "Nouveaux recrutements (30j)")}
          value={data.newHires30d}
          subtitle={t("dashboard.rh.kpi.hiringRhythm", "Rythme de recrutement")}
          icon={ClipboardCheck}
          color="green"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.pendingApprovals", "Demandes RH en attente")}
          value={data.pendingRhApprovals}
          subtitle={t("dashboard.rh.kpi.governanceFlow", "Moteur d'approbation")}
          icon={ClipboardCheck}
          color="orange"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.unreadAlerts", "Alertes RH non lues")}
          value={data.unreadRhAlerts}
          subtitle={t("dashboard.rh.kpi.alertCenter", "Centre d'alertes gouvernance")}
          icon={AlertTriangle}
          color="orange"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.slaAvgHours", "SLA moyen (heures)")}
          value={data.reporting.slaAvgHours}
          subtitle={t("dashboard.rh.kpi.approvalSla", "Delai moyen d'approbation")}
          icon={ShieldCheck}
          color="blue"
        />
        <StatsCard
          title={t("dashboard.rh.kpi.rejectionRate", "Taux de rejet (%)")}
          value={data.reporting.rejectionRatePct}
          subtitle={t("dashboard.rh.kpi.processedRequests", "Demandes traitees")}
          icon={AlertTriangle}
          color={data.reporting.rejectionRatePct >= 40 ? "red" : "green"}
        />
        <StatsCard
          title={t("dashboard.rh.kpi.pendingOver48h", "Demandes en attente > 48h")}
          value={data.reporting.pendingOver48h}
          subtitle={t("dashboard.rh.kpi.proactiveMonitoring", "Monitoring proactif")}
          icon={ClipboardCheck}
          color={data.reporting.pendingOver48h > 0 ? "orange" : "green"}
        />
      </div>

      <section className="card p-5">
        <h2 className="section-title">{t("dashboard.rh.proactiveAlerts", "Alertes proactives RH")}</h2>
        {data.reporting.proactiveAlerts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{t("dashboard.rh.proactiveAlertsNone", "Aucune alerte proactive.")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.reporting.proactiveAlerts.map((alertKey) => (
              <li key={alertKey} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {t(alertKey, alertKey)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">{t("dashboard.rh.recentEmployees", "Derniers collaborateurs")}</h2>
            <Link href="/admin/users" className="text-xs font-medium text-primary hover:underline">
              {t("dashboard.rh.manageUsers", "Gerer utilisateurs")} →
            </Link>
          </div>
          {data.recentEmployees.length === 0 ? (
            <p className="text-sm text-gray-500">{t("dashboard.rh.emptyEmployees", "Aucun collaborateur recemment ajoute.")}</p>
          ) : (
            <ul className="space-y-2">
              {data.recentEmployees.map((employee) => (
                <li key={employee.id} className="rounded-xl border border-gray-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-darktext">{employee.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {employee.email} · {employee.roleKey}
                        {employee.departmentKey ? ` · ${employee.departmentKey}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeTone(employee.isActive)}`}>
                      {employee.isActive
                        ? t("dashboard.rh.status.active", "Actif")
                        : t("dashboard.rh.status.inactive", "Inactif")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">{t("dashboard.rh.recentActivity", "Activite RH recente")}</h2>
            <Link href="/admin/activity-logs" className="text-xs font-medium text-primary hover:underline">
              {t("dashboard.rh.viewAudit", "Voir journal")} →
            </Link>
          </div>
          {data.recentRhActivity.length === 0 ? (
            <p className="text-sm text-gray-500">{t("dashboard.rh.emptyActivity", "Aucune activite RH recente.")}</p>
          ) : (
            <ul className="space-y-2">
              {data.recentRhActivity.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                  <span className="text-gray-700">
                    <span className="font-medium">{entry.moduleKey}</span> · {entry.actionKey}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5">
        <h2 className="section-title">{t("dashboard.rh.timeline", "Timeline RH")}</h2>
        {data.timeline.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{t("dashboard.rh.timelineEmpty", "Aucun evenement RH recent.")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.timeline.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <span className="text-gray-700">{event.label}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
