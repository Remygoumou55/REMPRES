import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import { getSupplierById } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { SupplierForm } from "../../supplier-form";
import { updateSupplierAction } from "../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { error?: string };
};

export default async function EditSupplierPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const supplier = await getSupplierById(params.id);
  if (!supplier) notFound();

  const action = updateSupplierAction.bind(null, params.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Modifier ${supplier.name}`}
        subtitle="Mise à jour du fournisseur"
        breadcrumbs={
          <Link
            href={`/logistique/fournisseurs/${supplier.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la fiche fournisseur
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <SupplierForm
        action={action}
        initial={supplier}
        submitLabel="Enregistrer les modifications"
        backHref={`/logistique/fournisseurs/${supplier.id}`}
      />
    </div>
  );
}
