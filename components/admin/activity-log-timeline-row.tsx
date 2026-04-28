"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Info, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeFullFr, formatDateDayFr } from "@/lib/utils/formatDate";
import type { Json } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Icônes & labels (identiques à la page serveur)
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, { phrase: string; icon: typeof Plus; color: string; bg: string }> = {
  create: { phrase: "a ajouté",    icon: Plus,   color: "text-emerald-600", bg: "bg-emerald-50" },
  update: { phrase: "a modifié",   icon: Pencil,  color: "text-amber-600",  bg: "bg-amber-50"  },
  delete: { phrase: "a supprimé",  icon: Trash2,  color: "text-red-500",   bg: "bg-red-50"    },
  export: { phrase: "a exporté",   icon: Download, color: "text-violet-600", bg: "bg-violet-50" },
};

const MODULE_LABELS: Record<string, string> = {
  clients:       "un client",
  produits:      "un produit",
  vente:         "une vente",
  depenses:      "une dépense",
  finance:       "le rapport finance",
  users:         "un utilisateur",
  utilisateurs:  "un utilisateur",
  formation:     "une formation",
  stock:         "le stock",
};

function toHumanPhrase(moduleKey: string, actionKey: string): string {
  const action = ACTION_LABELS[actionKey]?.phrase ?? `a effectué « ${actionKey} » sur`;
  const mod    = MODULE_LABELS[moduleKey] ?? `le module « ${moduleKey} »`;
  return `${action} ${mod}`;
}

function toRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)   return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `Il y a ${d} jour${d > 1 ? "s" : ""}`;
  return formatDateDayFr(dateStr);
}

function shortId(uuid: string): string {
  return uuid.slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------

export type ActivityLogRowProps = {
  row: {
    id: string;
    actor_user_id: string;
    module_key: string;
    action_key: string;
    target_table: string | null;
    target_id: string | null;
    metadata: Json;
    created_at: string;
  };
  actorName: string;
  isLast: boolean;
};

export function ActivityLogTimelineRow({ row, actorName, isLast }: ActivityLogRowProps) {
  const [open, setOpen] = useState(false);
  const actionCfg  = ACTION_LABELS[row.action_key] ?? ACTION_LABELS.update;
  const ActionIcon = actionCfg.icon;
  const phrase     = toHumanPhrase(row.module_key, row.action_key);
  const displayActor = row.actor_user_id ? actorName : "Système";

  return (
    <>
      <div className="relative flex gap-4 px-5 py-4 transition-colors hover:bg-gray-50/40">
        {!isLast && (
          <div className="absolute bottom-0 left-[2.6rem] top-12 w-px bg-gray-100" />
        )}

        <div className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${actionCfg.bg}`}>
          <ActionIcon size={14} className={actionCfg.color} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="text-sm font-semibold text-darktext">
                {displayActor}
              </span>
              <span className="ml-1.5 text-sm text-gray-500">{phrase}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-gray-400">{toRelativeTime(row.created_at)}</span>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/5"
              >
                <Info size={12} />
                Détails
              </button>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge label={row.module_key} variant="primary" />
            {row.target_table && row.target_id && (
              <span className="font-mono text-xs text-gray-400">#{shortId(row.target_id)}</span>
            )}
            <span className="text-xs text-gray-400" title="Date (jour)">
              {formatDateDayFr(row.created_at)}
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-darktext">Détail de l&apos;événement</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Action</dt>
                <dd className="font-medium text-darktext">{row.action_key}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Module</dt>
                <dd className="font-medium text-darktext">{row.module_key}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Utilisateur</dt>
                <dd className="text-right break-all text-darktext">{actorName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Date complète</dt>
                <dd className="text-right text-darktext">{formatDateTimeFullFr(row.created_at)}</dd>
              </div>
              {row.target_table && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Cible</dt>
                  <dd className="text-right text-darktext">
                    {row.target_table} {row.target_id ? `#${shortId(row.target_id)}` : ""}
                  </dd>
                </div>
              )}
            </dl>

            <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Métadonnées</p>
            <pre className="max-h-48 overflow-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
              {row.metadata
                ? JSON.stringify(row.metadata, null, 2)
                : "—"}
            </pre>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
