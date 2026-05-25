import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertConsultationWrite } from "@/lib/server/consultation-access";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createMissionAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewMissionPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader title="Nouvelle mission" />
      <FlashMessage error={searchParams?.error} />
      <form action={createMissionAction} className="card max-w-2xl space-y-4 p-6">
        <div>
          <label className="label">Titre *</label>
          <input name="title" required className="input w-full" />
        </div>
        <div>
          <label className="label">Client</label>
          <input name="client_name" className="input w-full" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={3} className="input w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Date début</label>
            <input name="start_date" type="date" className="input w-full" />
          </div>
          <div>
            <label className="label">Date fin</label>
            <input name="end_date" type="date" className="input w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Budget (GNF)</label>
            <input name="budget_gnf" type="number" defaultValue={0} className="input w-full" />
          </div>
          <div>
            <label className="label">Consultant lead</label>
            <input name="lead_consultant" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="label">Statut</label>
          <select name="status" defaultValue="draft" className="input w-full">
            <option value="draft">Brouillon</option>
            <option value="active">Active</option>
            <option value="on_hold">En pause</option>
          </select>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={2} className="input w-full" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
          <Link href="/consultation/missions" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
