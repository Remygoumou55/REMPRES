"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import type { SettingsGovernanceOverview } from "@/lib/server/settings-governance-overview";
import { findNavItemByKey, NAV_PARAMETRES_HUB_EXTRAS } from "@/lib/constants/nav-config";
import { NavIcon } from "@/components/ui/nav-icon";

type Props = {
  overview: SettingsGovernanceOverview;
};

const SIDEBAR_PILLARS = findNavItemByKey("parametres")?.children ?? [];
const HUB_EXTRA_CARDS = NAV_PARAMETRES_HUB_EXTRAS;

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

  const renderCard = (
    key: string,
    href: string,
    label: string,
    icon: string,
    hint: string,
    count: number | null,
    locked?: boolean,
  ) => {
    if (locked) {
      return (
        <div key={key} className="card flex flex-col border border-dashed border-gray-200 p-4 opacity-90 sm:p-5">
          <div className="flex items-start gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <Lock size={18} aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-darktext">{label}</p>
              <p className="text-xs text-gray-500">{hint}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={key}
        href={href}
        className="group card flex flex-col border border-gray-100 p-4 transition hover:border-primary/25 hover:shadow-md sm:p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <NavIcon iconName={icon} size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-darktext">{label}</p>
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
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-darktext">
        <p className="font-semibold">Centre de configuration ERP</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Utilisateurs, permissions, sécurité, devise, taux, notifications et paramètres système.
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
        {SIDEBAR_PILLARS.map((item) => {
          let hint = "Configuration gouvernée — accès centralisé.";
          let count: number | null = null;
          if (item.key === "utilisateurs") {
            hint = "Création, suspension, réactivation et réinitialisation d'accès.";
            count = overview.totalUsers;
          } else if (item.key === "securite") {
            hint = "Sessions, connexions et politiques d'accès.";
            count = overview.securityEvents24h;
          } else if (item.key === "notifications") {
            hint = "Alertes système et validations critiques.";
            count = overview.unreadAlerts;
          } else if (item.key === "systeme") {
            hint = "Santé plateforme, version et maintenance.";
          }
          return renderCard(item.key, item.href, item.label, item.icon, hint, count);
        })}
      </section>

      <section aria-label="Paramètres avancés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {HUB_EXTRA_CARDS.map((item) => {
          const locked = item.key === "langue";
          const hints: Record<string, string> = {
            permissions: "Rôles officiels ERP — un département, un rôle principal.",
            devise: "Devise de référence et affichage multi-devises.",
            taux: "Taux de change et conversions.",
            langue: "Français actif — autres langues verrouillées (gouvernance).",
          };
          return renderCard(
            item.key,
            item.href,
            item.label,
            item.icon,
            hints[item.key] ?? "",
            null,
            locked,
          );
        })}
      </section>
    </div>
  );
}
