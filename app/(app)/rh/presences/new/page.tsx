import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite } from "@/lib/server/rh-access";
import { listEmployeesForSelect } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { recordAttendanceAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { error?: string; employeeId?: string; date?: string };
};

export default async function NewPresencePage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const employees = await listEmployeesForSelect();
  const today = new Date().toISOString().slice(0, 10);
  const initialDate = (searchParams?.date ?? today).slice(0, 10);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Enregistrer une présence"
        subtitle="Saisir une présence journalière pour un collaborateur"
        breadcrumbs={
          <Link
            href="/rh/presences"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux présences
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />

      <form action={recordAttendanceAction} className="card space-y-5 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">
              Collaborateur <span className="text-red-500">*</span>
            </span>
            <select
              name="employee_id"
              required
              defaultValue={searchParams?.employeeId ?? ""}
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
              Date <span className="text-red-500">*</span>
            </span>
            <input
              type="date"
              name="date"
              required
              defaultValue={initialDate}
              className="input w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">
              Statut <span className="text-red-500">*</span>
            </span>
            <select
              name="status"
              required
              defaultValue="present"
              className="input w-full"
            >
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
              <option value="late">En retard</option>
              <option value="half_day">Demi-journée</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Heure d&apos;arrivée</span>
            <input type="time" name="arrival_time" className="input w-full" />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Heure de départ</span>
            <input type="time" name="departure_time" className="input w-full" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-medium text-gray-600">Notes</span>
            <textarea
              name="notes"
              rows={3}
              className="input w-full"
              placeholder="Observations (optionnel)"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Enregistrer la présence
          </button>
          <Link href="/rh/presences" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
