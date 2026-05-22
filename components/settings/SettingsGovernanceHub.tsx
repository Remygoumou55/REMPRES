"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import type { SettingsGovernanceOverview } from "@/lib/server/settings-governance-overview";
import { SETTINGS_GOVERNANCE_NAV } from "@/lib/settings/governance-nav";

type Props = {
  overview: SettingsGovernanceOverview;
};

const PILLARS = SETTINGS_GOVERNANCE_NAV.filter((x) => x.id !== "hub");

export function SettingsGovernanceHub({ overview }: Props) {
  const metric = (label: string, value: number, tone: "default" | "warn" = "default") => (
    <div
      className={`rounded-xl border px-3 py-2 ${
        tone === "warn" ? "border-amber-200 bg-amber-50/70 text-amber-950" : "border-gray-100 bg-gray-50/80 text-darktext"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-darktext">
        <p className="font-semibold">Centre de configuration ERP</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Utilisateurs, permissions, sécurité, devise, taux, notifications et paramètres système — sans console
          d&apos;administration hybride ni contrôles développeur.
        </p>
      </div>

      <section aria-label="Indicateurs — Paramètres" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {metric("Utilisateurs", overview.totalUsers)}
        {metric("Comptes actifs", overview.activeUsers)}
        {metric("En attente", overview.pendingUsers, overview.pendingUsers > 0 ? "warn" : "default")}
        {metric("Comptes bloqués", overview.inactiveUsers, overview.inactiveUsers > 0 ? "warn" : "default")}
        {metric("Journaux (24h)", overview.securityEvents24h)}
        {metric("Alertes non lues", overview.unreadAlerts, overview.unreadAlerts > 0 ? "warn" : "default")}
      </section>

      <section aria-label="Centres de configuration" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PILLARS.map((item) => {
          const Icon = item.icon;
          if (item.locked) {
            return (
              <div
                key={item.id}
                className="card flex flex-col border border-dashed border-gray-200 p-4 opacity-90 sm:p-5"
              >
                <div className="flex items-start gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                    <Lock size={18} aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-darktext">{item.label}</p>
                    <p className="text-xs text-gray-500">Français actif — autres langues verrouillées (gouvernance).</p>
                  </div>
                </div>
              </div>
            );
          }

          let hint = "Configuration gouvernée — accès centralisé.";
          let count: number | null = null;
          if (item.id === "users") {
            hint = "Création, suspension, réactivation et réinitialisation d'accès.";
            count = overview.totalUsers;
          } else if (item.id === "permissions") {
            hint = "Rôles officiels ERP — un département, un rôle principal.";
          } else if (item.id === "security") {
            hint = "Sessions, connexions et politiques d'accès — sans secrets techniques.";
            count = overview.securityEvents24h;
          } else if (item.id === "notifications") {
            hint = "Alertes système, validations critiques et événements importants.";
            count = overview.unreadAlerts;
          } else if (item.id === "system") {
            hint = "Santé plateforme, version et maintenance — pas de logs développeur.";
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
                    <p className="text-sm font-semibold text-darktext">{item.label}</p>
                    {count != null ? (
                      <p className="text-xs font-medium text-primary tabular-nums">{count} élément(s)</p>
                    ) : null}
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="mt-3 flex-1 text-xs leading-relaxed text-gray-500">{hint}</p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
