import { ShoppingBag } from "lucide-react";
import type { Client } from "@/types/client";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  SalesRowActions,
  type SaleRowForActions,
} from "@/components/vente/historique/sales-row-actions";

// ---------------------------------------------------------------------------
// Config statuts & paiements (inchangée vs page historique)
// ---------------------------------------------------------------------------

const STATUT_CFG: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "En attente", variant: "warning" },
  partial: { label: "Partiel", variant: "info" },
  paid: { label: "Payé", variant: "success" },
  overdue: { label: "En retard", variant: "danger" },
  cancelled: { label: "Annulé", variant: "gray" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  orange_money: "Orange Money",
  bank_transfer: "Virement",
  credit: "Crédit",
  mixed: "Mixte",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaleRow = {
  id: string;
  reference: string | null;
  client_id: string | null;
  total_amount_gnf: number;
  display_currency: string;
  payment_method: string | null;
  payment_status: string;
  amount_paid_gnf: number;
  created_at: string;
};

type SalesTableProps = {
  sales: SaleRow[];
  clientsById: Record<string, Client>;
  canDelete: boolean;
  listQueryString: string;
};

function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function SalesTable({ sales, clientsById, canDelete, listQueryString }: SalesTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Référence
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                Client
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Total
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">
                Paiement
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                Statut
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">
                Date
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag size={28} className="text-gray-200" />
                    <p className="text-sm text-gray-400">Aucune vente pour ces critères</p>
                  </div>
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const client = sale.client_id ? clientsById[sale.client_id] : undefined;
                const statut =
                  STATUT_CFG[sale.payment_status] ?? {
                    label: sale.payment_status,
                    variant: "gray" as BadgeVariant,
                  };
                const isPending =
                  sale.payment_status === "pending" || sale.payment_status === "partial";
                const labelRef = sale.reference ?? sale.id.slice(0, 8).toUpperCase();
                const saleForActions: SaleRowForActions = {
                  id: sale.id,
                  total_amount_gnf: sale.total_amount_gnf,
                  payment_status: sale.payment_status,
                };

                return (
                  <tr key={sale.id} className="group transition-colors hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <span className="rounded-lg bg-primary/5 px-2 py-1 font-mono text-xs font-semibold text-primary">
                        {labelRef}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-medium text-darktext">
                      {client ? (
                        getClientLabel(client)
                      ) : (
                        <span className="italic text-gray-400">Client de passage</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold tabular-nums text-darktext">
                        {sale.total_amount_gnf.toLocaleString("fr-FR")}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">{sale.display_currency}</span>
                    </td>

                    <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">
                      {sale.payment_method
                        ? PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method
                        : "—"}
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <Badge label={statut.label} variant={statut.variant} dot />
                    </td>

                    <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
                      {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <SalesRowActions
                        sale={saleForActions}
                        labelReference={labelRef}
                        canDelete={canDelete}
                        listQueryString={listQueryString}
                        showMarkPaid={isPending}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
