"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { NAV_ARCHIVES_HUB_EXTRAS } from "@/lib/constants/nav-config";
import { NavIcon } from "@/components/ui/nav-icon";

const TAB_ITEMS = NAV_ARCHIVES_HUB_EXTRAS;

const TAB_DETAILS: Record<
  string,
  { scope: string; bullets: readonly string[] }
> = {
  "archives-ventes": {
    scope: "Archives ventes",
    bullets: ["Devis archivés", "Ventes archivées", "Clients archivés", "Factures archivées"],
  },
  "archives-finance": {
    scope: "Archives finance",
    bullets: ["Dépenses archivées", "Paiements archivés", "Écritures archivées"],
  },
  "archives-rh": {
    scope: "Archives RH",
    bullets: ["Employés archivés", "Contrats archivés", "Absences archivées"],
  },
  "archives-formation": {
    scope: "Archives formation",
    bullets: ["Formations archivées", "Consultations archivées", "Sessions archivées"],
  },
  "historique-systeme": {
    scope: "Historique système",
    bullets: ["Événements critiques", "Migrations sensibles", "Changements système", "Événements sécurité"],
  },
};

export function ArchivesGovernanceHub() {
  const [activeKey, setActiveKey] = useState(TAB_ITEMS[0]?.key ?? "");

  const active = TAB_ITEMS.find((t) => t.key === activeKey) ?? TAB_ITEMS[0];
  const detail = active ? TAB_DETAILS[active.key] : null;

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
              workflow métier actif n&apos;est exposé ici.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2" role="tablist" aria-label="Archives par domaine">
        {TAB_ITEMS.map((tab) => {
          const selected = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveKey(tab.key)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${
                selected
                  ? "bg-primary text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-primary/30"
              }`}
            >
              <NavIcon iconName={tab.icon} size={14} className={selected ? "text-white" : "text-primary"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {active && detail ? (
        <article
          className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm"
          role="tabpanel"
          aria-label={active.label}
        >
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-primary">
              <NavIcon iconName={active.icon} size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-darktext">{active.label}</h2>
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{detail.scope}</p>
            </div>
          </div>
          <ul className="mb-5 list-inside list-disc space-y-1 text-sm text-gray-600">
            {detail.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <Link
            href={active.href}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-primary hover:bg-gray-50"
          >
            Ouvrir {active.label} →
          </Link>
        </article>
      ) : null}
    </div>
  );
}
