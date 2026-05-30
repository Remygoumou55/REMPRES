import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhRead } from "@/lib/server/rh-access";
import {
  getOverallLabel,
  listAllReviews,
  type PerformanceReviewStatus,
} from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import EvaluationButton from "@/components/rh/EvaluationButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    status?: string;
    period?: string;
  };
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function scoreTone(score: number): string {
  if (score >= 3.5) return "text-emerald-700";
  if (score >= 2) return "text-amber-700";
  return "text-red-700";
}

export default async function RhEvaluationsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhRead(user.id);

  const statusFilter =
    searchParams?.status === "draft" || searchParams?.status === "finalized"
      ? (searchParams.status as PerformanceReviewStatus)
      : undefined;

  const reviews = await listAllReviews({
    status: statusFilter,
    period: searchParams?.period,
  });

  const finalized = reviews.filter((r) => r.status === "finalized").length;
  const drafts = reviews.filter((r) => r.status === "draft").length;

  const baseQs = new URLSearchParams();
  if (searchParams?.period) baseQs.set("period", searchParams.period);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Évaluations de performance"
        subtitle="Suivi des évaluations collaborateurs"
        actions={
          <Link href="/rh/collaborateurs" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Nouvelle évaluation
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-800">
          {reviews.length} évaluation{reviews.length !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
          {finalized} finalisée{finalized !== 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-gray-50 px-3 py-1 font-medium text-gray-600">
          {drafts} brouillon{drafts !== 1 ? "s" : ""}
        </span>
      </div>

      <form method="get" className="card mb-6 flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Statut</label>
          <select
            name="status"
            defaultValue={searchParams?.status ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="finalized">Finalisée</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Période</label>
          <input
            name="period"
            type="search"
            defaultValue={searchParams?.period ?? ""}
            placeholder="Année 2026, S1..."
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
        {(statusFilter || searchParams?.period) ? (
          <Link href="/rh/evaluations" className="text-sm text-primary hover:underline">
            Réinitialiser
          </Link>
        ) : null}
      </form>

      {reviews.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <ClipboardCheck className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune évaluation enregistrée</p>
          <p className="max-w-md text-sm">
            Commencer par évaluer un collaborateur depuis sa fiche dans{" "}
            <Link href="/rh/collaborateurs" className="text-primary hover:underline">
              Collaborateurs
            </Link>
            .
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Collaborateur</th>
                <th className="p-3">Période</th>
                <th className="p-3">Note globale</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const overall = Number(review.overall_score);
                return (
                  <tr key={review.id} className="border-b border-gray-100">
                    <td className="p-3">
                      <Link
                        href={`/rh/collaborateurs/${review.employee_id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {review.employee_name}
                      </Link>
                    </td>
                    <td className="p-3">{review.period_label}</td>
                    <td className={`p-3 font-medium ${scoreTone(overall)}`}>
                      {overall.toFixed(1)} / 5 — {getOverallLabel(overall)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          review.status === "finalized"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {review.status === "finalized" ? "Finalisée" : "Brouillon"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{formatDate(review.created_at)}</td>
                    <td className="p-3 text-right">
                      {review.status === "finalized" ? (
                        <EvaluationButton
                          review={review}
                          employeeName={review.employee_name}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">PDF après finalisation</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
