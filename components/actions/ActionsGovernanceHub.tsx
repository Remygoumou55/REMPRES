"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ActionsGovernanceOverview } from "@/lib/server/actions-governance-overview";
import { GOVERNANCE_ACTIONS_NAV } from "@/lib/actions/governance-nav";

type Props = {
  overview: ActionsGovernanceOverview;
};

const PILLARS = GOVERNANCE_ACTIONS_NAV.filter((x) => x.id !== "hub");

export function ActionsGovernanceHub({ overview }: Props) {
  const metric = (label: string, value: number, tone: "default" | "warn" | "danger" = "default") => {
    const toneCls =
      tone === "danger"
        ? "border-red-200 bg-red-50/80 text-red-900"
        : tone === "warn"
          ? "border-amber-200 bg-amber-50/70 text-amber-950"
          : "border-gray-100 bg-gray-50/80 text-darktext";
    return (
      <div className={`rounded-xl border px-3 py-2 ${toneCls}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section aria-label="Indicateurs clés — module Actions" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {metric("Validations en attente", overview.pendingApprovals, overview.pendingApprovals > 0 ? "warn" : "default")}
        {metric("Alertes non lues", overview.unreadAlerts, overview.highOrCriticalUnreadAlerts > 0 ? "danger" : "default")}
        {metric("Alertes critiques / hautes", overview.highOrCriticalUnreadAlerts, overview.highOrCriticalUnreadAlerts > 0 ? "danger" : "default")}
        {metric("Événements audit (24h)", overview.auditEvents24h)}
        {metric("Entrées journaux (24h)", overview.activityLogs24h)}
        {metric("Jobs infra en file", overview.infrastructureJobsPending, overview.infrastructureJobsPending > 25 ? "warn" : "default")}
      </section>

      {overview.openObservabilityIncidents > 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-950">
          <span className="font-semibold">Incidents observabilité ouverts : </span>
          {overview.openObservabilityIncidents} — consulter l&apos;activité système pour le détail opérationnel.
        </div>
      ) : null}

      <section aria-label="Centres de contrôle" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PILLARS.map((item) => {
          const Icon = item.icon;
          let hint = "";
          let count: number | null = null;
          if (item.id === "approvals") {
            hint = "Validations humaines sensibles — traçabilité complète des décisions.";
            count = overview.pendingApprovals;
          } else if (item.id === "alerts") {
            hint = "Signaux critiques gouvernance — sécurité, anomalies, dépassements.";
            count = overview.unreadAlerts;
          } else if (item.id === "audit") {
            hint = "Traçabilité métier sensible — immuable, filtrable, exportable.";
            count = overview.auditEvents24h;
          } else if (item.id === "journals") {
            hint = "Journal applicatif et sessions — distinct de l&apos;audit métier.";
            count = overview.activityLogs24h;
          } else if (item.id === "system") {
            hint = "Santé plateforme, jobs, observabilité — sans logs développeur bruts.";
            count = overview.infrastructureJobsPending + overview.openObservabilityIncidents;
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group card flex flex-col border border-gray-100 p-4 transition hover:border-primary/25 hover:shadow-md sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={20} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-darktext sm:text-base">{item.label}</h2>
                    {count !== null ? (
                      <p className="text-xs font-semibold text-gray-500 tabular-nums">Indicateur rapide : {count}</p>
                    ) : null}
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-gray-600 sm:text-sm">{hint}</p>
              <span className="mt-3 text-xs font-semibold text-primary group-hover:underline">Ouvrir le centre →</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
