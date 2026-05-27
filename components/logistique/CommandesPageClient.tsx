"use client";

import { memo, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { PurchaseOrderForm } from "@/components/logistique/PurchaseOrderForm";
import { OrderStatusButton } from "@/components/logistique/OrderStatusButton";
import { deleteOrderAction } from "@/app/(app)/logistique/commandes/actions";
import {
  PO_STATUS_COLORS,
  PO_STATUS_LABELS,
} from "@/lib/logistique/purchase-order-shared";
import type { PurchaseOrder } from "@/lib/server/purchase-orders";

type Props = {
  orders: PurchaseOrder[];
  stockItems: { id: string; name: string; sku: string | null; unit_price_gnf: number }[];
};

function formatGNF(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function statusBadge(status: keyof typeof PO_STATUS_LABELS) {
  const colors = PO_STATUS_COLORS[status];
  return (
    <span
      className="rounded-full px-2 py-1 text-xs font-semibold"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {PO_STATUS_LABELS[status]}
    </span>
  );
}

function CommandesPageClientInner({ orders, stockItems }: Props) {
  const [openCreate, setOpenCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const okStatus = statusFilter === "all" || o.status === statusFilter;
      const needle = search.trim().toLowerCase();
      const okSearch =
        !needle ||
        o.supplier_name.toLowerCase().includes(needle) ||
        o.order_number.toLowerCase().includes(needle);
      return okStatus && okSearch;
    });
  }, [orders, search, statusFilter]);

  const counts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      received: orders.filter((o) => o.status === "received").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders],
  );

  function removeOrder(id: string) {
    startTransition(async () => {
      const result = await deleteOrderAction(id);
      setMessage(result.success ? "Commande supprimée." : result.error ?? "Suppression impossible.");
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs sm:grid-cols-4">
        <p>En attente: <strong>{counts.pending}</strong></p>
        <p>Confirmées: <strong>{counts.confirmed}</strong></p>
        <p>Reçues: <strong>{counts.received}</strong></p>
        <p>Annulées: <strong>{counts.cancelled}</strong></p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="received">Reçues</option>
          <option value="cancelled">Annulées</option>
        </select>
        <input
          className="min-w-72 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Rechercher fournisseur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setOpenCreate(true)}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
        >
          Nouvelle commande
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">{message}</p>
      ) : null}

      {filtered.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <ShoppingCart className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune commande fournisseur</p>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            Créer la première commande
          </button>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-3">N° Cmd</th>
                <th className="p-3">Fournisseur</th>
                <th className="p-3">Articles</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Livraison</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const overdue =
                  order.expected_delivery_date &&
                  new Date(order.expected_delivery_date) < new Date() &&
                  order.status !== "received";
                return (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-mono font-semibold">{order.order_number}</td>
                    <td className="p-3">{order.supplier_name}</td>
                    <td className="p-3">{order.items_count} article(s)</td>
                    <td className="p-3 text-right tabular-nums">{formatGNF(order.total_gnf)}</td>
                    <td className={`p-3 text-xs ${overdue ? "font-semibold text-red-700" : "text-gray-600"}`}>
                      {order.expected_delivery_date
                        ? new Date(order.expected_delivery_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="p-3">{statusBadge(order.status)}</td>
                    <td className="p-3">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/logistique/commandes/${order.id}`}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Détail
                          </Link>
                          {order.status === "pending" ? (
                            <Link
                              href={`/logistique/commandes/${order.id}`}
                              className="text-xs font-medium text-blue-700 hover:underline"
                            >
                              Modifier
                            </Link>
                          ) : null}
                          {["pending", "cancelled"].includes(order.status) ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => removeOrder(order.id)}
                              className="text-xs font-medium text-red-700 hover:underline disabled:opacity-60"
                            >
                              Supprimer
                            </button>
                          ) : null}
                        </div>
                        <OrderStatusButton
                          orderId={order.id}
                          currentStatus={order.status}
                          orderNumber={order.order_number}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Nouvelle commande fournisseur"
        subtitle="Créer et confirmer les approvisionnements"
        size="4xl"
      >
        <PurchaseOrderForm
          stockItems={stockItems}
          onCancel={() => setOpenCreate(false)}
          onSuccess={(orderNumber) => {
            setMessage(`Commande ${orderNumber} créée.`);
            setOpenCreate(false);
          }}
        />
      </Modal>
    </div>
  );
}

export const CommandesPageClient = memo(CommandesPageClientInner);
