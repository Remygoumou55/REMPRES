"use client";

import { memo, useState } from "react";
import Link from "next/link";
import type { Deliverable, Mission, MissionPhase } from "@/lib/types/consultation";
import { MissionStatusBadge } from "@/components/consultation/mission-status-badge";

type Props = {
  mission: Mission;
  phases: MissionPhase[];
  deliverables: Deliverable[];
  canWrite: boolean;
  addDeliverableAction: (formData: FormData) => Promise<void>;
  addPhaseAction: (formData: FormData) => Promise<void>;
  deleteAction: () => Promise<void>;
};

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function MissionDetailClientInner({
  mission,
  phases,
  deliverables,
  canWrite,
  addDeliverableAction,
  addPhaseAction,
  deleteAction,
}: Props) {
  const [tab, setTab] = useState<"overview" | "deliverables" | "phases">("overview");
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const progress = phases.length ? Math.round((completedPhases / phases.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{mission.reference}</p>
          <h1 className="text-2xl font-bold text-darktext">{mission.title}</h1>
          <div className="mt-2">
            <MissionStatusBadge status={mission.status} />
          </div>
        </div>
        {canWrite ? (
          <div className="flex gap-2">
            <Link href={`/consultation/missions/${mission.id}?edit=1`} className="btn-secondary text-sm">
              Modifier
            </Link>
            <form action={deleteAction}>
              <button type="submit" className="btn-danger text-sm">
                Supprimer
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-gray-500">
        Avancement phases : {completedPhases}/{phases.length} ({progress}%)
      </p>

      <div className="flex gap-2 border-b border-gray-200">
        {(["overview", "deliverables", "phases"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-primary text-primary" : "text-gray-600"}`}
          >
            {t === "overview" ? "Vue d'ensemble" : t === "deliverables" ? "Livrables" : "Phases"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Client</h3>
            <p>{mission.client_name ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Consultant lead</h3>
            <p>{mission.lead_consultant ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Budget</h3>
            <p>{formatGNF(Number(mission.budget_gnf))}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Payé / Facturé</h3>
            <p>
              {formatGNF(Number(mission.amount_paid_gnf))} / {formatGNF(Number(mission.amount_invoiced_gnf))}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Dates</h3>
            <p>
              {mission.start_date ?? "—"} → {mission.end_date ?? "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700">Description</h3>
            <p className="text-sm text-gray-600">{mission.description ?? "—"}</p>
          </div>
        </section>
      ) : null}

      {tab === "deliverables" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form action={addDeliverableAction} className="card flex flex-wrap gap-3 p-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <input name="title" required placeholder="Titre du livrable" className="input flex-1 min-w-[200px]" />
              <input name="due_date" type="date" className="input" />
              <button type="submit" className="btn-primary text-sm">
                Ajouter livrable
              </button>
            </form>
          ) : null}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3">Titre</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Échéance</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="p-3">{d.title}</td>
                    <td className="p-3">{d.status}</td>
                    <td className="p-3">{d.due_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!deliverables.length ? <p className="p-4 text-gray-500">Aucun livrable.</p> : null}
          </div>
        </section>
      ) : null}

      {tab === "phases" ? (
        <section className="space-y-4">
          {canWrite ? (
            <form action={addPhaseAction} className="card flex flex-wrap gap-3 p-4">
              <input type="hidden" name="mission_id" value={mission.id} />
              <input name="title" required placeholder="Titre de la phase" className="input flex-1 min-w-[200px]" />
              <button type="submit" className="btn-primary text-sm">
                Ajouter phase
              </button>
            </form>
          ) : null}
          <ul className="space-y-2">
            {phases.map((p) => (
              <li key={p.id} className="card flex items-center justify-between p-4 text-sm">
                <span className="font-medium">{p.title}</span>
                <span className="text-gray-500">{p.status}</span>
              </li>
            ))}
          </ul>
          {!phases.length ? <p className="text-gray-500">Aucune phase définie.</p> : null}
        </section>
      ) : null}
    </div>
  );
}

export const MissionDetailClient = memo(MissionDetailClientInner);
