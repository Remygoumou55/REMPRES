import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Printer,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { Client } from "@/types/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SaleItemRow = {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price_gnf: number;
  discount_percent: number;
  total_price_gnf: number;
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const STATUT_CFG: Record<string, { label: string; variant: BadgeVariant }> = {
  pending:   { label: "En attente", variant: "warning" },
  partial:   { label: "Partiel",    variant: "info"    },
  paid:      { label: "Payé",       variant: "success" },
  overdue:   { label: "En retard",  variant: "danger"  },
  cancelled: { label: "Annulé",     variant: "gray"    },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:          "Espèces",
  mobile_money:  "Mobile Money",
  bank_transfer: "Virement bancaire",
  credit:        "Crédit",
  mixed:         "Paiement mixte",
};

function formatGNF(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount)) + " GNF";
}

function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type PageProps = { params: { id: string } };

export default async function SaleDetailPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const permissions = await getModulePermissions(auth.user.id, ["vente"]);
  if (!permissions.canRead) redirect("/access-denied");

  // ── Récupérer la vente ───────────────────────────────────────────────────
  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      "id,reference,client_id,seller_id,subtotal,discount_percent,discount_amount,total_amount_gnf,display_currency,exchange_rate,payment_method,payment_status,amount_paid_gnf,notes,created_at",
    )
    .eq("id", params.id)
    .is("deleted_at", null)
    .single();

  if (error || !sale) return notFound();

  // ── Récupérer les lignes de vente ────────────────────────────────────────
  const { data: itemsRaw } = await supabase
    .from("sale_items")
    .select("id,product_name,product_sku,quantity,unit_price_gnf,discount_percent,total_price_gnf")
    .eq("sale_id", params.id)
    .order("id");

  const items = (itemsRaw ?? []) as SaleItemRow[];

  // ── Client (si existant) ─────────────────────────────────────────────────
  let client: Client | null = null;
  if (sale.client_id) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", sale.client_id)
      .single();
    client = clientData as Client | null;
  }

  const statut = STATUT_CFG[sale.payment_status] ?? { label: sale.payment_status, variant: "gray" as BadgeVariant };

  return (
    <div className="mx-auto max-w-3xl space-y-5">

      {/* ── Fil d'Ariane + retour ───────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/vente/historique"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <ArrowLeft size={14} />
          Historique
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono text-sm font-semibold text-primary">
          {sale.reference ?? sale.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* ── Entête vente ────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Receipt size={18} className="text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-darktext">
                  Vente {sale.reference ?? "#" + sale.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-xs text-gray-400">
                  {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                    weekday: "long", day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge label={statut.label} variant={statut.variant} dot />
            <a
              href={`/vente/recu/${sale.id}?print=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <Printer size={13} />
              Imprimer
            </a>
          </div>
        </div>

        {/* Infos meta */}
        <div className="grid gap-4 px-6 py-4 sm:grid-cols-3">
          {/* Client */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <User size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Client</p>
              <p className="text-sm font-semibold text-darktext">
                {client ? getClientLabel(client) : (
                  <span className="italic text-gray-400">Client de passage</span>
                )}
              </p>
              {client?.phone && (
                <p className="text-xs text-gray-400">{client.phone}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <Calendar size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-semibold text-darktext">
                {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(sale.created_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Paiement */}
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <CreditCard size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Mode de paiement</p>
              <p className="text-sm font-semibold text-darktext">
                {sale.payment_method ? (PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method) : "—"}
              </p>
              <p className="text-xs text-gray-400">
                Payé : {formatGNF(sale.amount_paid_gnf)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lignes de produits ───────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-darktext">
            <Package size={15} className="text-primary" />
            Produits ({items.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Aucun article enregistré pour cette vente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Désignation</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qté</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Prix unit.</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-darktext">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="text-xs text-gray-400 font-mono">{item.product_sku}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold tabular-nums text-darktext">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-600">
                      {formatGNF(item.unit_price_gnf)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-darktext">
                      {formatGNF(item.total_price_gnf)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Totaux ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="space-y-2 px-6 py-5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-semibold tabular-nums text-darktext">
              {formatGNF(sale.subtotal ?? sale.total_amount_gnf)}
            </span>
          </div>
          {(sale.discount_percent ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Remise ({sale.discount_percent}%)</span>
              <span className="font-semibold tabular-nums text-red-500">
                −{formatGNF(sale.discount_amount ?? 0)}
              </span>
            </div>
          )}
          <div className="flex justify-between rounded-2xl bg-primary/5 px-4 py-3 text-base">
            <span className="font-bold text-darktext">Total</span>
            <span className="text-xl font-extrabold tabular-nums text-primary">
              {formatGNF(sale.total_amount_gnf)}
            </span>
          </div>
          {sale.display_currency && sale.display_currency !== "GNF" && (
            <p className="text-right text-xs text-gray-400">
              Devise d&apos;affichage : {sale.display_currency}
            </p>
          )}
        </div>
      </div>

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      {sale.notes && (
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Notes</p>
          <p className="mt-1.5 text-sm text-gray-700">{sale.notes}</p>
        </div>
      )}

    </div>
  );
}
