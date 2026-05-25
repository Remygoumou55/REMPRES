import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertConsultationRead, assertConsultationWrite } from "@/lib/server/consultation-access";
import { getModulePermissions } from "@/lib/server/permissions";
import {
  getMissionById,
  listDeliverables,
  listMissionPhases,
} from "@/lib/server/consultation";
import { FlashMessage } from "@/components/ui/flash-message";
import { MissionDetailClient } from "@/components/consultation/mission-detail-client";
import {
  addDeliverableAction,
  addPhaseAction,
  deleteMissionAction,
  updateMissionAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { success?: string; error?: string; edit?: string };
};

export default async function MissionDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationRead(user.id);

  const [mission, phases, deliverables, perms] = await Promise.all([
    getMissionById(params.id),
    listMissionPhases(params.id),
    listDeliverables(params.id),
    getModulePermissions(user.id, ["consultation"]),
  ]);

  if (!mission) notFound();

  const canWrite = perms.canCreate || perms.canUpdate;

  if (searchParams?.edit === "1") {
    await assertConsultationWrite(user.id);
    return (
      <div className="page-wrapper">
        <FlashMessage success={searchParams?.success} error={searchParams?.error} />
        <h1 className="mb-6 text-2xl font-bold">Modifier la mission</h1>
        <form action={updateMissionAction.bind(null, params.id)} className="card max-w-2xl space-y-4 p-6">
          <div>
            <label className="label">Titre</label>
            <input name="title" required defaultValue={mission.title} className="input w-full" />
          </div>
          <div>
            <label className="label">Client</label>
            <input name="client_name" defaultValue={mission.client_name ?? ""} className="input w-full" />
          </div>
          <div>
            <label className="label">Budget GNF</label>
            <input name="budget_gnf" type="number" defaultValue={mission.budget_gnf} className="input w-full" />
          </div>
          <div>
            <label className="label">Statut</label>
            <select name="status" defaultValue={mission.status} className="input w-full">
              <option value="draft">Brouillon</option>
              <option value="active">Active</option>
              <option value="on_hold">En pause</option>
              <option value="completed">Terminée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
          <Link href={`/consultation/missions/${params.id}`} className="btn-secondary ml-2">
            Annuler
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />
      <MissionDetailClient
        mission={mission}
        phases={phases}
        deliverables={deliverables}
        canWrite={canWrite}
        addDeliverableAction={addDeliverableAction}
        addPhaseAction={addPhaseAction}
        deleteAction={deleteMissionAction.bind(null, params.id)}
      />
      <Link href="/consultation/missions" className="mt-6 inline-block text-sm text-primary">
        ← Retour aux missions
      </Link>
    </div>
  );
}
