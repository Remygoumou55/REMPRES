import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import { getStockItemById, listWarehousesForSelect } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { updateStockItemAction } from "../../actions";
import { StockItemForm } from "../../stock-item-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { error?: string };
};

export default async function EditArticlePage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const [item, warehouses] = await Promise.all([
    getStockItemById(params.id),
    listWarehousesForSelect(),
  ]);
  if (!item) notFound();

  const action = updateStockItemAction.bind(null, params.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Modifier ${item.name}`}
        subtitle="Mise à jour de l'article"
        breadcrumbs={
          <Link
            href={`/logistique/articles/${item.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la fiche article
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <StockItemForm
        action={action}
        warehouses={warehouses}
        initial={item}
        submitLabel="Enregistrer les modifications"
        backHref={`/logistique/articles/${item.id}`}
      />
    </div>
  );
}
