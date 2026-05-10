"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { EVALUATION_RECOMMENDATIONS } from "@/modules/hr/recruitment/constants";
import type { RecruitmentEvaluation } from "@/modules/hr/recruitment/types";
import { addEvaluationAction } from "@/modules/hr/recruitment/server/actions/recruitment-actions";

export function EvaluationPanel({
  candidateId,
  evaluations,
}: {
  candidateId: string;
  evaluations: RecruitmentEvaluation[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState("");
  const [recommendation, setRecommendation] =
    useState<(typeof EVALUATION_RECOMMENDATIONS)[number]>("hold");
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-2">
      <form
        className="grid gap-2 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await addEvaluationAction({
              candidateId,
              score: score ? Number(score) : null,
              recommendation,
              comments: comments.trim() || null,
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setScore("");
            setComments("");
            refresh();
          });
        }}
      >
        <input
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.eval.score", "Score 1-5")}
        />
        <select
          value={recommendation}
          onChange={(e) =>
            setRecommendation(e.target.value as (typeof EVALUATION_RECOMMENDATIONS)[number])
          }
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
        >
          {EVALUATION_RECOMMENDATIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs md:col-span-3"
          placeholder={t("dashboard.rh.recruitment.eval.comments", "Commentaires")}
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white md:col-span-3">
          {t("dashboard.rh.recruitment.eval.submit", "Enregistrer evaluation")}
        </button>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ul className="space-y-1 text-[11px] text-gray-700">
        {evaluations.map((ev) => (
          <li key={ev.id} className="rounded border border-gray-100 px-2 py-1">
            {ev.recommendation} · score {ev.score ?? "—"} · {new Date(ev.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
