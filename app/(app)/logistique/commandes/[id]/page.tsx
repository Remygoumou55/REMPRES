import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { OrderStatusButton } from "@/components/logistique/OrderStatusButton";
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from "@/lib/logistique/purchase-order-shared";
import { getPurchaseOrderById } from "@/lib/server/purchase-orders";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
};

function formatGNF(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function CommandeDetailPage({ params }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const order = await getPurchaseOrderById(params.id);
  if (!order) notFound();

  const colors = PO_STATUS_COLORS[order.status];

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title={`Commande ${order.order_number}`}
        subtitle="Détail commande fournisseur"
        breadcrumbs={
          <Link href="/logistique/commandes" className="text-xs font-medium text-primary hover:underline">
            ← Retour aux commandes
          </Link>
        }
        actions={
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {PO_STATUS_LABELS[order.status]}
          </span>
        }
      />

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-darktext">Informations</h2>
          <OrderStatusButton
            orderId={order.id}
            currentStatus={order.status}
            orderNumber={order.order_number}
          />
        </div>
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">Fournisseur</dt>
            <dd className="font-medium">{order.supplier_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Contact</dt>
            <dd>{order.supplier_contact ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Date prévue</dt>
            <dd>
              {order.expected_delivery_date
                ? new Date(order.expected_delivery_date).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Date réception</dt>
            <dd>
              {order.received_at
                ? new Date(order.received_at).toLocaleDateString("fr-FR")
                : "—"}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-xs text-gray-500">Notes</dt>
            <dd>{order.notes ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="border-b px-4 py-3 text-sm font-semibold text-darktext">Articles commandés</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3">Article</th>
              <th className="p-3 text-right">Qté commandée</th>
              <th className="p-3 text-right">Prix unitaire</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-3">{item.product_name}</td>
                <td className="p-3 text-right tabular-nums">{item.quantity_ordered}</td>
                <td className="p-3 text-right tabular-nums">{formatGNF(item.unit_price_gnf)}</td>
                <td className="p-3 text-right tabular-nums font-medium">{formatGNF(item.total_gnf)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="p-3 font-bold" colSpan={3}>
                TOTAL
              </td>
              <td className="p-3 text-right font-bold tabular-nums">{formatGNF(order.total_gnf)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
