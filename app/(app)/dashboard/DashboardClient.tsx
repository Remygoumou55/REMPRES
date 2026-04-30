"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  UserPlus,
  ClipboardList,
  UserCog,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  Activity,
  BarChart2,
  Download,
} from "lucide-react";
import { KpiCard } from "@/components/ui/kpi-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/utils/formatCurrency";
import { useCurrencyStore } from "@/stores/currencyStore";
import { convertAmount } from "@/lib/currencyService";
import type { DashboardKpis, RecentActivityEntry } from "@/lib/server/dashboard-kpis";
import { withCreateModalQuery } from "@/lib/routing/modal-query";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardClientProps = {
  userDisplayName: string;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  kpis: DashboardKpis;
};

const SalesChart = dynamic(
  () =>
    import("@/components/dashboard/sales-chart").then((m) => ({ default: m.SalesChart })),
  {
    loading: () => <Skeleton className="h-36 w-full rounded-2xl" />,
    ssr: false,
  },
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function toRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

const ACTION_META: Record<string, { label: string; icon: typeof Plus; color: string }> = {
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

// ---------------------------------------------------------------------------
// ActivityTimeline — activité récente
// ---------------------------------------------------------------------------

function ActivityTimeline({ events }: { events: RecentActivityEntry[] }) {
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
            {/* Indicateur timeline */}
            <div className="flex flex-col items-center pt-1">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs ${meta.color}`}>
                <Icon size={12} />
              </div>
              {idx < events.length - 1 && (
                <div className="mt-1 h-full w-px bg-gray-100 min-h-[16px]" />
              )}
            </div>
            {/* Contenu */}
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
}

// ---------------------------------------------------------------------------
// Quick Action Card
// ---------------------------------------------------------------------------

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: typeof ShoppingCart;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-darktext">{label}</p>
        <p className="truncate text-xs text-gray-400">{description}</p>
      </div>
      <ArrowRight size={14} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function DashboardClient({
  userDisplayName,
  canReadClients,
  canReadProducts,
  canReadActivityLogs,
  isSuperAdmin = false,
  kpis,
}: DashboardClientProps) {
  const greeting    = getGreeting();
  const displayName = userDisplayName.trim() || "Compte";
  const hasStockAlert = kpis.productsOutOfStock > 0 || kpis.productsLowStock > 0;

  // Devise sélectionnée par l'utilisateur
  const currency = useCurrencyStore((s) => s.selectedCurrency);
  const rates    = useCurrencyStore((s) => s.rates);
  const rate     = rates[currency] ?? 1;

  function fmt(amountGNF: number) {
    return formatMoney(amountGNF, currency, rate);
  }
  function fmtConverted(amountGNF: number) {
    return formatMoney(convertAmount(amountGNF, currency, rates), currency, 1);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Welcome banner ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-light p-6 text-white shadow-sm">
        <p className="text-sm font-medium text-white/70">{greeting},</p>
        <h1 className="mt-1 text-2xl font-bold">{displayName} 👋</h1>
        <p className="mt-1 text-sm text-white/60">Voici un aperçu de votre activité du jour.</p>
      </div>

      {/* ── Alerte stock ─────────────────────────────────────────────────── */}
      {hasStockAlert && canReadProducts && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle size={18} className="shrink-0 text-amber-600" />
          <p className="flex-1 text-sm text-amber-800">
            {kpis.productsOutOfStock > 0 && (
              <span className="font-semibold">{kpis.productsOutOfStock} en rupture. </span>
            )}
            {kpis.productsLowStock > 0 && (
              <span>{kpis.productsLowStock} produit(s) à stock faible.</span>
            )}
          </p>
          <Link
            href="/vente/produits"
            className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            Voir →
          </Link>
        </div>
      )}

      {/* ── KPI Grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Clients actifs"
          value={kpis.clientsTotal}
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          sub="Base clients totale"
        />
        <KpiCard
          label="Ventes aujourd'hui"
          value={kpis.salesToday}
          icon={ShoppingCart}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          sub={kpis.salesAmountToday > 0 ? fmtConverted(kpis.salesAmountToday) : "Aucune vente"}
        />
        <KpiCard
          label="CA ce mois"
          value={fmtConverted(kpis.salesAmountMonth)}
          icon={TrendingUp}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          sub={`${kpis.salesCountMonth} transaction${kpis.salesCountMonth !== 1 ? "s" : ""}`}
        />
        <KpiCard
          label="Stock à surveiller"
          value={kpis.productsLowStock + kpis.productsOutOfStock}
          icon={Package}
          iconColor={hasStockAlert ? "text-amber-600" : "text-gray-400"}
          iconBg={hasStockAlert ? "bg-amber-50" : "bg-gray-100"}
          sub={kpis.productsOutOfStock > 0 ? `${kpis.productsOutOfStock} en rupture` : "Tout va bien"}
        />
      </div>

      {/* ── Graphique + Activité récente ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Graphique 7 jours (2/3) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
                <BarChart2 size={16} className="text-primary" />
                Ventes — 7 derniers jours
              </h2>
              <p className="text-xs text-gray-400">Montant total en GNF</p>
            </div>
            <Link
              href="/vente/historique"
              className="text-xs font-medium text-primary hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <SalesChart data={kpis.salesLast7Days} />
        </div>

        {/* Activité récente (1/3) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
              <Activity size={15} className="text-primary" />
              Activité récente
            </h2>
            {canReadActivityLogs && (
              <Link
                href="/admin/activity-logs"
                className="text-xs font-medium text-primary hover:underline"
              >
                Tout →
              </Link>
            )}
          </div>
          <ActivityTimeline events={kpis.recentActivity} />
        </div>
      </div>

      {/* ── Actions rapides ───────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
          Actions rapides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {canReadProducts && (
            <QuickAction
              href="/vente/nouvelle-vente"
              icon={ShoppingCart}
              label="Nouvelle vente"
              description="Encaisser un client maintenant"
              color="bg-primary/10 text-primary"
            />
          )}
          {canReadClients && (
            <QuickAction
              href={withCreateModalQuery("/vente/clients")}
              icon={UserPlus}
              label="Ajouter un client"
              description="Créer une fiche client"
              color="bg-emerald-50 text-emerald-600"
            />
          )}
          {canReadProducts && (
            <QuickAction
              href={withCreateModalQuery("/vente/produits")}
              icon={PlusCircle}
              label="Ajouter un produit"
              description="Référencer un nouveau produit"
              color="bg-sky-50 text-sky-600"
            />
          )}
          {canReadActivityLogs && (
            <QuickAction
              href="/admin/activity-logs"
              icon={ClipboardList}
              label="Journal d'activité"
              description="Consulter les logs système"
              color="bg-violet-50 text-violet-600"
            />
          )}
          {canReadProducts && (
            <QuickAction
              href="/vente/historique"
              icon={TrendingUp}
              label="Historique des ventes"
              description="Voir toutes les transactions"
              color="bg-orange-50 text-orange-600"
            />
          )}
          {isSuperAdmin && (
            <QuickAction
              href="/admin/users"
              icon={UserCog}
              label="Gérer les utilisateurs"
              description="Inviter et configurer les accès"
              color="bg-pink-50 text-pink-600"
            />
          )}
        </div>
      </div>

    </div>
  );
}
