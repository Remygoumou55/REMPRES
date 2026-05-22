"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { ARCHIVES_GOVERNANCE_NAV, type ArchivesGovernanceNavItem } from "@/lib/archives/governance-nav";

const CATEGORY_GOVERNANCE: Record<
  ArchivesGovernanceNavItem["id"],
  { scope: string; bullets: readonly string[] }
> = {
  hub: {
    scope: "Centre de gouvernance historique",
    bullets: [
      "Consultation et supervision uniquement — aucune mutation depuis ces écrans.",
      "Traçabilité alignée sur les journaux d’audit et les exports autorisés.",
    ],
  },
  sales: {
    scope: "Archives ventes",
    bullets: ["Devis archivés", "Ventes archivées", "Clients archivés", "Factures archivées"],
  },
  finance: {
    scope: "Archives finance",
    bullets: ["Dépenses archivées", "Paiements archivés", "Écritures archivées"],
  },
  hr: {
    scope: "Archives RH",
    bullets: ["Employés archivés", "Contrats archivés", "Absences archivées"],
  },
  training: {
    scope: "Archives formation",
    bullets: ["Formations archivées", "Consultations archivées", "Sessions archivées"],
  },
  exports: {
    scope: "Exports",
    bullets: ["Exports CSV", "Exports Excel", "Exports PDF", "Exports système"],
  },
  deletions: {
    scope: "Suppressions",
    bullets: ["Suppressions critiques", "Suppressions sensibles", "Suppressions sécurité"],
  },
  systemHistory: {
    scope: "Historique système",
    bullets: ["Événements critiques", "Migrations sensibles", "Changements système", "Événements sécurité"],
  },
};

export function ArchivesGovernanceHub() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Lock size={18} aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-amber-950">Module Archives — lecture seule</p>
            <p className="text-xs leading-relaxed text-amber-900/90">
              Espace de conservation, traçabilité et supervision historique. Aucune édition, aucune suppression et aucun
              workflow métier actif n&apos;est exposé ici. Les mutations restent dans les modules opérationnels
              habilités.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ARCHIVES_GOVERNANCE_NAV.map((item) => {
          const detail = CATEGORY_GOVERNANCE[item.id];
          const Icon = item.icon;
          const isHub = item.id === "hub";
          return (
            <article
              key={item.id}
              className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md ${
                isHub ? "border-primary/30 ring-1 ring-primary/10" : "border-gray-200/80"
              }`}
            >
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-primary">
                  <Icon size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-darktext">{item.label}</h2>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{detail.scope}</p>
                </div>
              </div>
              <ul className="mb-4 flex-1 list-inside list-disc space-y-1 text-xs text-gray-600">
                {detail.bullets.map((b) => (
                  <li key={b} className="leading-snug">
                    {b}
                  </li>
                ))}
              </ul>
              {!isHub ? (
                <Link
                  href={item.href}
                  className="mt-auto inline-flex min-h-[40px] items-center justify-center rounded-xl border border-gray-200 px-3 text-xs font-semibold text-primary hover:bg-gray-50"
                >
                  Ouvrir la vue
                </Link>
              ) : (
                <p className="mt-auto text-[11px] font-medium text-gray-400">Vous êtes sur la vue d&apos;ensemble.</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
