import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { SupplierForm } from "../supplier-form";
import { createSupplierAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewSupplierPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Ajouter un fournisseur"
        subtitle="Référencer un nouveau partenaire"
        breadcrumbs={
          <Link
            href="/logistique/fournisseurs"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux fournisseurs
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <SupplierForm action={createSupplierAction} submitLabel="Créer le fournisseur" />
    </div>
  );
}
