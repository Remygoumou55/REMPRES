import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import {
  listStockItemsForSelect,
  listWarehousesForSelect,
} from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { MovementForm } from "./movement-form";
import { recordStockMovementAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { itemId?: string; error?: string };
};

export default async function NewMovementPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const [items, warehouses] = await Promise.all([
    listStockItemsForSelect(),
    listWarehousesForSelect(),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Nouveau mouvement de stock"
        subtitle="Entrée, sortie, ajustement ou transfert"
        breadcrumbs={
          <Link
            href="/logistique/mouvements"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux mouvements
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <MovementForm
        items={items}
        warehouses={warehouses}
        defaultItemId={searchParams?.itemId}
        action={recordStockMovementAction}
      />
    </div>
  );
}
