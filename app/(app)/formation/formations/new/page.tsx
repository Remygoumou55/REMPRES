import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationWrite } from "@/lib/server/formation-access";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createTrainingAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewFormationPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader title="Nouvelle formation" subtitle="Créer une formation" />
      <FlashMessage error={searchParams?.error} />
      <form action={createTrainingAction} className="card max-w-2xl space-y-4 p-6">
        <div>
          <label className="label">Titre *</label>
          <input name="title" required className="input w-full" />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <input name="category" className="input w-full" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={3} className="input w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Durée (heures)</label>
            <input name="duration_hours" type="number" step="0.5" defaultValue={0} className="input w-full" />
          </div>
          <div>
            <label className="label">Prix (GNF)</label>
            <input name="price_gnf" type="number" defaultValue={0} className="input w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Places max</label>
            <input name="max_participants" type="number" defaultValue={20} className="input w-full" />
          </div>
          <div>
            <label className="label">Statut</label>
            <select name="status" defaultValue="draft" className="input w-full">
              <option value="draft">Brouillon</option>
              <option value="active">Active</option>
              <option value="completed">Terminée</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Formateur</label>
            <input name="instructor_name" className="input w-full" />
          </div>
          <div>
            <label className="label">Lieu</label>
            <input name="location" className="input w-full" />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
          <Link href="/formation/formations" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
