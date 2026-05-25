import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationWrite } from "@/lib/server/formation-access";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createTraineeAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewApprenantPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader title="Ajouter un apprenant" />
      <FlashMessage error={searchParams?.error} />
      <form action={createTraineeAction} className="card max-w-2xl space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Prénom *</label>
            <input name="first_name" required className="input w-full" />
          </div>
          <div>
            <label className="label">Nom *</label>
            <input name="last_name" required className="input w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input w-full" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input name="phone" className="input w-full" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Entreprise</label>
            <input name="company" className="input w-full" />
          </div>
          <div>
            <label className="label">Fonction</label>
            <input name="trainee_function" className="input w-full" />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea name="notes" rows={3} className="input w-full" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
          <Link href="/formation/apprenants" className="btn-secondary">
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
