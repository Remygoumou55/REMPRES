import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { CommandesPageClient } from "@/components/logistique/CommandesPageClient";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";
import {
  listPurchaseOrders,
  listStockItemsForOrder,
} from "@/lib/server/purchase-orders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommandesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const [ordersResult, stockItems] = await Promise.all([
    listPurchaseOrders(),
    listStockItemsForOrder(),
  ]);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Commandes fournisseurs"
        subtitle="Gestion des approvisionnements"
      />

      <CommandesPageClient orders={ordersResult.data} stockItems={stockItems} />
    </div>
  );
}
