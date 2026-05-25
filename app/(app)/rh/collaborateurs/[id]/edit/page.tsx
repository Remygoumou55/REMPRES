import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite } from "@/lib/server/rh-access";
import { getEmployeeById } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { updateEmployeeAction } from "../../actions";
import { EmployeeForm } from "../../employee-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { error?: string };
};

export default async function EditCollaborateurPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const employee = await getEmployeeById(params.id);
  if (!employee) notFound();

  const action = updateEmployeeAction.bind(null, params.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Modifier ${employee.first_name} ${employee.last_name}`}
        subtitle="Mise à jour des informations du collaborateur"
        breadcrumbs={
          <Link
            href={`/rh/collaborateurs/${employee.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la fiche
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <EmployeeForm
        action={action}
        initial={employee}
        submitLabel="Enregistrer les modifications"
        backHref={`/rh/collaborateurs/${employee.id}`}
      />
    </div>
  );
}
