"use client";

import Link from "next/link";
import {
  Clock,
  Coins,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type ActivityItem = {
  id: string;
  action: "create" | "update" | "delete" | "restore" | "sale" | "payment";
  module: string;
  actor: string;
  timeAgo: string;
};

const ACTION_META: Record<
  ActivityItem["action"],
  { verb: string; icon: LucideIcon; bg: string; color: string }
> = {
  create: { verb: "Création", icon: Plus, bg: "#ECFDF5", color: "#10B981" },
  update: { verb: "Modification", icon: Pencil, bg: "#EFF6FF", color: "#2D7CC4" },
  delete: { verb: "Suppression", icon: Trash2, bg: "#FEF2F2", color: "#EF4444" },
  restore: { verb: "Restauration", icon: RefreshCw, bg: "#FFFBEB", color: "#F59E0B" },
  sale: { verb: "Vente", icon: ShoppingCart, bg: "#EFF6FF", color: "#2D7CC4" },
  payment: { verb: "Paiement", icon: Coins, bg: "#ECFDF5", color: "#10B981" },
};

export type ActivityFeedProps = {
  items: ActivityItem[];
  title?: string;
  viewAllHref?: string;
};

export function ActivityFeed({ items, title = "Activité récente", viewAllHref }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <section className="py-4">
        {title ? (
          <h2 className="mb-3 text-sm font-semibold text-gray-800">{title}</h2>
        ) : null}
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Clock size={22} className="text-gray-300" />
          <p className="text-sm text-gray-500">Aucune activité récente</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-xs font-medium text-primary hover:underline">
            Voir tout →
          </Link>
        ) : null}
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const meta = ACTION_META[item.action] ?? ACTION_META.update;
          const Icon = meta.icon;
          return (
            <li key={item.id} className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: meta.bg }}
              >
                <Icon size={14} style={{ color: meta.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">
                  {meta.verb} dans <strong className="font-semibold text-gray-900">{item.module}</strong> —{" "}
                  {item.actor}
                </p>
                <p className="text-xs text-gray-400">{item.timeAgo}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
