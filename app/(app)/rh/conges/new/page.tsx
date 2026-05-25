import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite } from "@/lib/server/rh-access";
import { listEmployeesForSelect } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createLeaveRequestAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { error?: string; employeeId?: string };
};

export default async function NewCongePage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const employees = await listEmployeesForSelect();
  const preselectedEmployee = searchParams?.employeeId ?? "";

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Nouvelle demande de congé"
        subtitle="Enregistrer une demande pour un collaborateur"
        breadcrumbs={
          <Link
            href="/rh/conges"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux congés
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />

      <form action={createLeaveRequestAction} className="card space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Collaborateur <span className="text-red-500">*</span>
            </span>
            <select
              name="employee_id"
              required
              defaultValue={preselectedEmployee}
              className="input w-full"
            >
              <option value="" disabled>
                Sélectionner un collaborateur…
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label} — {e.department}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Type de congé <span className="text-red-500">*</span>
            </span>
            <select
              name="leave_type"
              required
              defaultValue="annual"
              className="input w-full"
            >
              <option value="annual">Congé annuel</option>
              <option value="sick">Congé maladie</option>
              <option value="special">Congé spécial</option>
              <option value="unpaid">Sans solde</option>
            </select>
          </label>

          <div />

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Date de début <span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              name="start_date"
              required
              className="input w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Date de fin <span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              name="end_date"
              required
              className="input w-full"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Motif</span>
            <textarea
              name="reason"
              rows={4}
              className="input w-full"
              placeholder="Motif de la demande (optionnel)"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Envoyer la demande
          </button>
          <Link href="/rh/conges" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
