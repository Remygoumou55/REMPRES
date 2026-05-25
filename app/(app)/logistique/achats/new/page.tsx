import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import { listSuppliersForSelect } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { PurchaseOrderForm } from "./purchase-order-form";
import { createPurchaseOrderAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewPurchaseOrderPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const suppliers = await listSuppliersForSelect();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Nouvelle commande d'achat"
        subtitle="La commande sera soumise au Super Admin pour approbation."
        breadcrumbs={
          <Link
            href="/logistique/achats"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux commandes
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <PurchaseOrderForm suppliers={suppliers} action={createPurchaseOrderAction} />
    </div>
  );
}
