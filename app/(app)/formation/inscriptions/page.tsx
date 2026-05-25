import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationRead } from "@/lib/server/formation-access";
import { listEnrollments, listTraineesForSelect, listTrainingsForSelect } from "@/lib/server/formation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { createEnrollmentAction, updateEnrollmentStatusAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { status?: string; success?: string; error?: string } };

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function InscriptionsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationRead(user.id);

  const [{ data, total }, trainings, trainees] = await Promise.all([
    listEnrollments(undefined, searchParams?.status ?? "all"),
    listTrainingsForSelect(),
    listTraineesForSelect(),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader title="Inscriptions" subtitle={`${total} inscription(s)`} />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <details className="card mb-6 p-4">
        <summary className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Plus className="h-4 w-4" />
          Nouvelle inscription
        </summary>
        <form action={createEnrollmentAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Formation</label>
            <select name="training_id" required className="input w-full">
              <option value="">—</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Apprenant</label>
            <select name="trainee_id" required className="input w-full">
              <option value="">—</option>
              {trainees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select name="status" defaultValue="pending" className="input w-full">
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmée</option>
              <option value="completed">Terminée</option>
            </select>
          </div>
          <div>
            <label className="label">Montant (GNF)</label>
            <input name="amount_paid_gnf" type="number" defaultValue={0} className="input w-full" />
          </div>
          <div>
            <label className="label">Paiement</label>
            <select name="payment_method" className="input w-full">
              <option value="">—</option>
              <option value="especes">Espèces</option>
              <option value="orange_money">Orange Money</option>
              <option value="virement">Virement</option>
              <option value="gratuit">Gratuit</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary text-sm">
              Créer
            </button>
          </div>
        </form>
      </details>

      <form method="get" className="mb-4">
        <select name="status" defaultValue={searchParams?.status ?? "all"} className="input max-w-[200px]">
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmée</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
        <button type="submit" className="btn-secondary ml-2 text-sm">
          Filtrer
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">Apprenant</th>
              <th className="p-3">Formation</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="p-3">
                  {e.trainee ? `${e.trainee.first_name} ${e.trainee.last_name}` : e.trainee_id}
                </td>
                <td className="p-3">{e.training?.title ?? e.training_id}</td>
                <td className="p-3">{e.status}</td>
                <td className="p-3">{formatGNF(Number(e.amount_paid_gnf))}</td>
                <td className="p-3">{new Date(e.enrolled_at).toLocaleDateString("fr-FR")}</td>
                <td className="p-3">
                  <form action={updateEnrollmentStatusAction.bind(null, e.id, "confirmed")}>
                    <button type="submit" className="text-xs text-primary">
                      Confirmer
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length ? <p className="p-4 text-gray-500">Aucune inscription.</p> : null}
      </div>
    </div>
  );
}
