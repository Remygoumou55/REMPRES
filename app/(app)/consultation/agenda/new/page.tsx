import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertConsultationWrite } from "@/lib/server/consultation-access";
import { listMissionsForSelect } from "@/lib/server/consultation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createAppointmentAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewAppointmentPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);

  const missions = await listMissionsForSelect();

  return (
    <div className="page-wrapper">
      <PageHeader title="Nouveau rendez-vous" />
      <FlashMessage error={searchParams?.error} />
      <form action={createAppointmentAction} className="card max-w-2xl space-y-4 p-6">
        <div>
          <label className="label">Titre *</label>
          <input name="title" required className="input w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Date *</label>
            <input name="appointment_date" type="date" required className="input w-full" />
          </div>
          <div>
            <label className="label">Client</label>
            <input name="client_name" className="input w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Heure début</label>
            <input name="start_time" type="time" className="input w-full" />
          </div>
          <div>
            <label className="label">Heure fin</label>
            <input name="end_time" type="time" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="label">Lieu</label>
          <input name="location" className="input w-full" />
        </div>
        <div>
          <label className="label">Mission (optionnel)</label>
          <select name="mission_id" className="input w-full">
            <option value="">—</option>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input w-full" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={2} className="input w-full" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
          <Link href="/consultation/agenda" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
