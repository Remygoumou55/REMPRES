"use client";

import { memo } from "react";
import { type LucideIcon, Plus, Pencil, Trash2, Download, Activity } from "lucide-react";
import type { RecentActivityEntry } from "@/lib/server/dashboard-kpis";

const ACTION_META: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  create: { label: "Création",     icon: Plus,    color: "text-emerald-500 bg-emerald-50" },
  update: { label: "Modification", icon: Pencil,  color: "text-sky-500 bg-sky-50"       },
  delete: { label: "Suppression",  icon: Trash2,  color: "text-red-400 bg-red-50"        },
  export: { label: "Export",       icon: Download, color: "text-violet-500 bg-violet-50" },
};

const MODULE_LABELS: Record<string, string> = {
  clients:       "Clients",
  produits:      "Produits",
  vente:         "Ventes",
  depenses:      "Dépenses",
  finance:       "Finance",
  utilisateurs:  "Utilisateurs",
  activity_logs: "Journal",
};

function toRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

export const ActivityTimeline = memo(function ActivityTimeline({ events }: { events: RecentActivityEntry[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Activity size={22} className="text-gray-200" />
        <p className="text-sm text-gray-400">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((ev, idx) => {
        const meta = ACTION_META[ev.action_key] ?? ACTION_META["update"];
        const Icon = meta.icon;
        const moduleLabel = MODULE_LABELS[ev.module_key] ?? ev.module_key;
        return (
          <div key={ev.id} className="flex gap-3 group">
            <div className="flex flex-col items-center pt-1">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs ${meta.color}`}>
                <Icon size={12} />
              </div>
              {idx < events.length - 1 && (
                <div className="mt-1 h-full w-px bg-gray-100 min-h-[16px]" />
              )}
            </div>
            <div className="flex-1 pb-3 pt-0.5">
              <p className="text-sm text-darktext leading-snug">
                <span className="font-semibold">{meta.label}</span>
                {" dans "}
                <span className="font-semibold text-primary">{moduleLabel}</span>
              </p>
              <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                {(ev.actor_display_name ?? "").trim() ? (
                  <>
                    <span className="text-xs text-gray-400 truncate max-w-[160px]">
                      {ev.actor_display_name}
                    </span>
                    <span className="text-[10px] text-gray-300">•</span>
                  </>
                ) : null}
                <span className="text-xs text-gray-400">{toRelativeTime(ev.created_at)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
