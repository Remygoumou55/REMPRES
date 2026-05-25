import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite } from "@/lib/server/rh-access";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createEmployeeAction } from "../actions";
import { EmployeeForm } from "../employee-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewCollaborateurPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Ajouter un collaborateur"
        subtitle="Créer un nouvel enregistrement dans l’annuaire RH"
        breadcrumbs={
          <Link
            href="/rh/collaborateurs"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux collaborateurs
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <EmployeeForm action={createEmployeeAction} submitLabel="Créer le collaborateur" />
    </div>
  );
}
