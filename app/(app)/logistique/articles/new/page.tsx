import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import { listWarehousesForSelect } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createStockItemAction } from "../actions";
import { StockItemForm } from "../stock-item-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewArticlePage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const warehouses = await listWarehousesForSelect();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Ajouter un article"
        subtitle="Créer un nouvel article dans l'inventaire"
        breadcrumbs={
          <Link
            href="/logistique/articles"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux articles
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <StockItemForm
        action={createStockItemAction}
        warehouses={warehouses}
        submitLabel="Créer l'article"
      />
    </div>
  );
}
