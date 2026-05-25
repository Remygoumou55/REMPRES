import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationRead, assertFormationWrite } from "@/lib/server/formation-access";
import {
  countTrainingCertificates,
  countTrainingEnrollments,
  getTrainingById,
  listTrainingSessions,
} from "@/lib/server/formation";
import { FlashMessage } from "@/components/ui/flash-message";
import { TrainingStatusBadge } from "@/components/formation/training-status-badge";
import { deleteTrainingAction, updateTrainingAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { success?: string; error?: string; edit?: string };
};

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function FormationDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationRead(user.id);

  const [training, sessions, enrollCount, certCount] = await Promise.all([
    getTrainingById(params.id),
    listTrainingSessions(params.id),
    countTrainingEnrollments(params.id),
    countTrainingCertificates(params.id),
  ]);

  if (!training) notFound();

  const isEdit = searchParams?.edit === "1";

  if (isEdit) {
    await assertFormationWrite(user.id);
    return (
      <div className="page-wrapper">
        <FlashMessage success={searchParams?.success} error={searchParams?.error} />
        <h1 className="mb-6 text-2xl font-bold">Modifier la formation</h1>
        <form action={updateTrainingAction.bind(null, params.id)} className="card max-w-2xl space-y-4 p-6">
          <div>
            <label className="label">Titre *</label>
            <input name="title" required defaultValue={training.title} className="input w-full" />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <input name="category" defaultValue={training.category ?? ""} className="input w-full" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" rows={3} defaultValue={training.description ?? ""} className="input w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Durée (h)</label>
              <input name="duration_hours" type="number" step="0.5" defaultValue={training.duration_hours} className="input w-full" />
            </div>
            <div>
              <label className="label">Prix GNF</label>
              <input name="price_gnf" type="number" defaultValue={training.price_gnf} className="input w-full" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Places</label>
              <input name="max_participants" type="number" defaultValue={training.max_participants} className="input w-full" />
            </div>
            <div>
              <label className="label">Statut</label>
              <select name="status" defaultValue={training.status} className="input w-full">
                <option value="draft">Brouillon</option>
                <option value="active">Active</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Formateur</label>
              <input name="instructor_name" defaultValue={training.instructor_name ?? ""} className="input w-full" />
            </div>
            <div>
              <label className="label">Lieu</label>
              <input name="location" defaultValue={training.location ?? ""} className="input w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
            <Link href={`/formation/formations/${params.id}`} className="btn-secondary">
              Annuler
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{training.title}</h1>
          <div className="mt-2">
            <TrainingStatusBadge status={training.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/formation/formations/${params.id}?edit=1`} className="btn-secondary text-sm">
            Modifier
          </Link>
          <form action={deleteTrainingAction.bind(null, params.id)}>
            <button type="submit" className="btn-danger text-sm">
              Supprimer
            </button>
          </form>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">Inscrits</p>
          <p className="text-xl font-bold">{enrollCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Certificats</p>
          <p className="text-xl font-bold">{certCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Prix</p>
          <p className="text-xl font-bold">{formatGNF(Number(training.price_gnf))}</p>
        </div>
      </div>

      <section className="card mb-6 p-6">
        <h2 className="mb-4 font-semibold">Détails</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Catégorie</dt>
            <dd>{training.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Durée</dt>
            <dd>{training.duration_hours} h</dd>
          </div>
          <div>
            <dt className="text-gray-500">Formateur</dt>
            <dd>{training.instructor_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Lieu</dt>
            <dd>{training.location ?? "—"}</dd>
          </div>
        </dl>
        {training.description ? <p className="mt-4 text-sm text-gray-600">{training.description}</p> : null}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Sessions ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune session planifiée.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {sessions.map((s) => (
              <li key={s.id} className="flex justify-between border-b border-gray-100 py-2">
                <span>{s.session_date}</span>
                <span className="text-gray-500">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/formation/formations" className="mt-6 inline-block text-sm text-primary">
        ← Retour aux formations
      </Link>
    </div>
  );
}
