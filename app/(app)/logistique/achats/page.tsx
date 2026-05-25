import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Package, Plus, ShoppingCart, X } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertLogistiqueRead,
  canLogistiqueApprove,
} from "@/lib/server/logistique-access";
import {
  countPendingPurchaseOrders,
  listPurchaseOrders,
} from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { PurchaseOrderStatusBadge } from "@/components/logistique/logistique-badges";
import {
  approvePurchaseOrderAction,
  cancelPurchaseOrderAction,
  receivePurchaseOrderAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    status?: string;
    success?: string;
    error?: string;
  };
};

const TABS = [
  { id: "all", label: "Toutes" },
  { id: "submitted", label: "En attente" },
  { id: "approved", label: "Approuvées" },
  { id: "received", label: "Reçues" },
  { id: "cancelled", label: "Annulées" },
] as const;

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function AchatsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const status = TABS.some((t) => t.id === (searchParams?.status ?? "all"))
    ? (searchParams?.status ?? "all")
    : "all";

  const [{ data, total }, pendingCount, canApprove] = await Promise.all([
    listPurchaseOrders({ status, pageSize: 80 }),
    countPendingPurchaseOrders(),
    canLogistiqueApprove(user.id),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Commandes d'achat"
        subtitle={`${total} commande${total > 1 ? "s" : ""} · ${pendingCount} en attente`}
        actions={
          <Link
            href="/logistique/achats/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nouvelle commande
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <nav className="mb-6 flex flex-wrap border-b border-gray-200">
        {TABS.map((t) => {
          const active = status === t.id;
          const badge = t.id === "submitted" && pendingCount > 0 ? pendingCount : null;
          return (
            <Link
              key={t.id}
              href={`/logistique/achats?status=${t.id}`}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-darktext"
              }`}
            >
              {t.label}
              {badge !== null ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <ShoppingCart className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune commande</p>
          <p className="text-xs">
            Cliquez sur « Nouvelle commande » pour créer votre première commande
            d&apos;achat.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">N° commande</th>
                <th className="p-3">Fournisseur</th>
                <th className="p-3 text-right">Articles</th>
                <th className="p-3 text-right">Montant total</th>
                <th className="p-3">Date prévue</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((po) => {
                const items = Array.isArray(po.items) ? po.items : [];
                return (
                  <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs font-semibold">
                      {po.reference}
                    </td>
                    <td className="p-3">
                      {po.supplier ? (
                        <Link
                          href={`/logistique/fournisseurs/${po.supplier_id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {po.supplier.company_name}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <Package className="h-3.5 w-3.5" />
                        {items.length}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium">
                      {formatGNF(Number(po.total_amount_gnf))}
                    </td>
                    <td className="p-3 text-xs">
                      {po.expected_date
                        ? new Date(po.expected_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="p-3">
                      <PurchaseOrderStatusBadge status={po.status} />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {po.status === "submitted" && canApprove ? (
                          <form action={approvePurchaseOrderAction.bind(null, po.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                            >
                              <Check className="h-3.5 w-3.5" /> Approuver
                            </button>
                          </form>
                        ) : null}
                        {po.status === "approved" ? (
                          <form action={receivePurchaseOrderAction.bind(null, po.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
                            >
                              <Check className="h-3.5 w-3.5" /> Marquer reçue
                            </button>
                          </form>
                        ) : null}
                        {po.status !== "cancelled" && po.status !== "received" ? (
                          <form action={cancelPurchaseOrderAction.bind(null, po.id)}>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                            >
                              <X className="h-3.5 w-3.5" /> Annuler
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
