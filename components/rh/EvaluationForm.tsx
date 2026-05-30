"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";
import { createReviewAction } from "@/app/(app)/rh/evaluations/actions";
import EvaluationButton from "@/components/rh/EvaluationButton";
import {
  CRITERIA_LABELS,
  getOverallLabel,
  SCORE_LABELS,
  type CriteriaKey,
  type PerformanceReview,
  type PerformanceReviewStatus,
} from "@/lib/rh/performance-reviews-shared";

const CRITERIA_KEYS: CriteriaKey[] = [
  "score_quality",
  "score_punctuality",
  "score_teamwork",
  "score_initiative",
  "score_objectives",
];

type Props = {
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
  onCancel: () => void;
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition hover:bg-amber-50"
          aria-label={`Note ${n}`}
        >
          <Star
            className={`h-6 w-6 ${
              n <= value
                ? "fill-amber-400 text-amber-500"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
      {value > 0 ? (
        <span className="ml-2 text-xs text-gray-600">{SCORE_LABELS[value]}</span>
      ) : null}
    </div>
  );
}

const EvaluationForm = memo(function EvaluationForm({
  employeeId,
  employeeName,
  onSuccess,
  onCancel,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState("");
  const [status, setStatus] = useState<PerformanceReviewStatus>("draft");
  const [comments, setComments] = useState("");
  const [objectivesNext, setObjectivesNext] = useState("");
  const [scores, setScores] = useState<Record<CriteriaKey, number>>({
    score_quality: 0,
    score_punctuality: 0,
    score_teamwork: 0,
    score_initiative: 0,
    score_objectives: 0,
  });

  const overall = useMemo(() => {
    const values = CRITERIA_KEYS.map((k) => scores[k]).filter((v) => v > 0);
    if (values.length !== CRITERIA_KEYS.length) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { avg, label: getOverallLabel(avg) };
  }, [scores]);

  function setScore(key: CriteriaKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!periodLabel.trim()) {
      setError("La période est obligatoire.");
      return;
    }
    for (const key of CRITERIA_KEYS) {
      if (scores[key] < 1 || scores[key] > 5) {
        setError("Attribuez une note de 1 à 5 pour chaque critère.");
        return;
      }
    }

    startTransition(async () => {
      const result = await createReviewAction({
        employee_id: employeeId,
        period_label: periodLabel.trim(),
        status,
        score_quality: scores.score_quality,
        score_punctuality: scores.score_punctuality,
        score_teamwork: scores.score_teamwork,
        score_initiative: scores.score_initiative,
        score_objectives: scores.score_objectives,
        comments: comments.trim() || undefined,
        objectives_next_period: objectivesNext.trim() || undefined,
      });
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? "Impossible d'enregistrer l'évaluation.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Évaluation de {employeeName}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Critères d&apos;évaluation (1 = Insuffisant, 5 = Excellent)
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Période *
              </label>
              <input
                type="text"
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="Année 2026 ou S1 2026"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PerformanceReviewStatus)
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="draft">Brouillon</option>
                <option value="finalized">Finalisée</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
            {CRITERIA_KEYS.map((key) => (
              <div
                key={key}
                className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-medium text-gray-800">
                  {CRITERIA_LABELS[key]}
                </span>
                <StarRating value={scores[key]} onChange={(v) => setScore(key, v)} />
              </div>
            ))}
            <div className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-primary">
              {overall
                ? `Note globale : ${overall.avg.toFixed(1)} / 5 — ${overall.label}`
                : "Note globale : complétez les 5 critères"}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Commentaire général
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Points forts, observations..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Objectifs période suivante
            </label>
            <textarea
              value={objectivesNext}
              onChange={(e) => setObjectivesNext(e.target.value)}
              rows={3}
              placeholder="Objectifs pour la prochaine période..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? "Enregistrement..." : "Enregistrer l'évaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EvaluationForm;

type BlockProps = {
  employeeId: string;
  employeeName: string;
  reviews: PerformanceReview[];
  canManage: boolean;
};

export const EmployeeEvaluationsBlock = memo(function EmployeeEvaluationsBlock({
  employeeId,
  employeeName,
  reviews,
  canManage,
}: BlockProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="card mt-8 space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-darktext">
          Évaluations de performance
        </h2>
        {canManage ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm"
          >
            + Nouvelle évaluation
          </button>
        ) : null}
      </div>

      {showForm ? (
        <EvaluationForm
          employeeId={employeeId}
          employeeName={employeeName}
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {reviews.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Période</th>
                <th className="p-3">Note</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-gray-100">
                  <td className="p-3 font-medium">{review.period_label}</td>
                  <td className="p-3">
                    {Number(review.overall_score).toFixed(1)} / 5 —{" "}
                    {getOverallLabel(Number(review.overall_score))}
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
                  <td className="p-3 text-right">
                    {review.status === "finalized" ? (
                      <EvaluationButton
                        review={review}
                        employeeName={employeeName}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Aucune évaluation pour ce collaborateur.
        </p>
      )}
    </section>
  );
});
