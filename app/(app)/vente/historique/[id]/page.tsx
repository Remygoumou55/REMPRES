import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Package,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Printer,
  ExternalLink,
  FileText,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { TableShell } from "@/components/ui/table-shell";
import { DetailPageModal } from "@/components/ui/detail-page-modal";
import type { Client } from "@/types/client";
import { formatMoney, type SupportedCurrency } from "@/lib/utils/formatCurrency";
import { statusTranslationKey } from "@/lib/i18n/statuses";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { loadLocaleMessages, translateFromDict } from "@/lib/i18n/load-messages";

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

const STATUT_CFG: Record<string, { variant: BadgeVariant }> = {
  pending:   { variant: "warning" },
  partial:   { variant: "info"    },
  paid:      { variant: "success" },
  overdue:   { variant: "danger"  },
  cancelled: { variant: "gray"    },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:          "Espèces",
  mobile_money:  "Mobile Money",
  orange_money:  "Orange Money",
  bank_transfer: "Virement bancaire",
  credit:        "Crédit",
  mixed:         "Paiement mixte",
};

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
  const [{ data: auth }, locale] = await Promise.all([supabase.auth.getUser(), getRequestLocale()]);
  const { messages } = await loadLocaleMessages(locale);
  const t = (key: string) => translateFromDict(messages, key);
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

  // ── Devis d'origine (si converti) ───────────────────────────────────────
  const { data: quoteOrigin } = await supabase
    .from("quotes" as never)
    .select("id, quote_number")
    .eq("converted_to_sale_id", params.id)
    .is("deleted_at", null)
    .maybeSingle();

  const quoteRef = quoteOrigin as { id: string; quote_number: string } | null;

  const statut   = STATUT_CFG[sale.payment_status] ?? { variant: "gray" as BadgeVariant };
  const currency = (sale.display_currency ?? "GNF") as SupportedCurrency;
  const rate     = Number(sale.exchange_rate) || 1;
  /** Formate un montant GNF dans la devise de la vente */
  function fmt(amountGNF: number) { return formatMoney(amountGNF, currency, rate); }

  return (
    <DetailPageModal
      title={`Vente ${sale.reference ?? "#" + sale.id.slice(0, 8).toUpperCase()}`}
      subtitle={new Date(sale.created_at).toLocaleDateString("fr-FR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      })}
      icon={<Receipt size={18} />}
      closeHref="/vente/historique"
      size="2xl"
    >

      {/* ── Statut + actions ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge label={t(statusTranslationKey(sale.payment_status))} variant={statut.variant} dot />
        <a
          href={`/vente/recu/${sale.id}?print=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <Printer size={13} />
          Imprimer
        </a>
      </div>

      {quoteRef ? (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Créé depuis le devis{" "}
                <span className="font-mono">{quoteRef.quote_number}</span>
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Traçabilité commerciale</p>
            </div>
          </div>
          <Link
            href={`/vente/devis/${quoteRef.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Voir le devis
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}

      {/* ── Infos méta : Client / Date / Paiement ────────────────────────── */}
      <div className="grid gap-2.5 rounded-2xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm sm:grid-cols-3">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <User size={13} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Client</p>
            <p className="truncate text-sm font-semibold text-darktext">
              {client ? getClientLabel(client) : (
                <span className="italic text-gray-400">Client de passage</span>
              )}
            </p>
            {client?.phone && (
              <p className="truncate text-[11px] text-gray-400">{client.phone}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <Calendar size={13} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Date</p>
            <p className="text-sm font-semibold text-darktext">
              {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </p>
            <p className="text-[11px] text-gray-400">
              {new Date(sale.created_at).toLocaleTimeString("fr-FR", {
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
            <CreditCard size={13} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Paiement</p>
            <p className="truncate text-sm font-semibold text-darktext">
              {sale.payment_method ? (PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method) : "—"}
            </p>
            <p className="truncate text-[11px] text-gray-400">
              Payé : {fmt(sale.amount_paid_gnf)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Produits + Totaux (carte unique) ─────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-3.5 py-2.5">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-darktext">
            <Package size={14} className="text-primary" />
            Produits ({items.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            Aucun article enregistré pour cette vente.
          </div>
        ) : (
          <TableShell className="border-0 shadow-none rounded-none bg-transparent">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-3.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Désignation</th>
                  <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Qté</th>
                  <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Prix unit.</th>
                  <th className="px-3.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50/40">
                    <td className="px-3.5 py-2.5">
                      <p className="text-sm font-medium text-darktext">{item.product_name}</p>
                      {item.product_sku && (
                        <p className="font-mono text-[11px] text-gray-400">{item.product_sku}</p>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-right text-sm font-bold tabular-nums text-darktext">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-2.5 text-right text-sm tabular-nums text-gray-600">
                      {fmt(item.unit_price_gnf)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-sm font-semibold tabular-nums text-darktext">
                      {fmt(item.total_price_gnf)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}

        {/* Totaux intégrés à la carte */}
        <div className="space-y-1.5 border-t border-gray-100 bg-gray-50/40 px-3.5 py-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Sous-total</span>
            <span className="font-semibold tabular-nums text-darktext">
              {fmt(sale.subtotal ?? sale.total_amount_gnf)}
            </span>
          </div>
          {(sale.discount_percent ?? 0) > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Remise ({sale.discount_percent}%)</span>
              <span className="font-semibold tabular-nums text-red-500">
                −{fmt(sale.discount_amount ?? 0)}
              </span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
            <span className="text-sm font-bold text-darktext">Total</span>
            <div className="text-right">
              <p className="text-lg font-extrabold leading-none tabular-nums text-primary">
                {fmt(sale.total_amount_gnf)}
              </p>
              {currency !== "GNF" && (
                <p className="mt-0.5 text-[10px] font-normal text-gray-400">
                  ≈ {formatMoney(sale.total_amount_gnf, "GNF", 1)} · Taux {rate}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Notes ───────────────────────────────────────────────────────── */}
      {sale.notes && (
        <div className="rounded-2xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Notes</p>
          <p className="mt-1 text-xs text-gray-700">{sale.notes}</p>
        </div>
      )}

    </DetailPageModal>
  );
}
