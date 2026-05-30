/** Client-safe types & labels for performance reviews (no server imports). */

export type PerformanceReviewStatus = "draft" | "finalized";

export type PerformanceReview = {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  employee_department: string;
  reviewer_id: string | null;
  period_label: string;
  score_quality: number;
  score_punctuality: number;
  score_teamwork: number;
  score_initiative: number;
  score_objectives: number;
  overall_score: number;
  comments: string | null;
  objectives_next_period: string | null;
  status: PerformanceReviewStatus;
  created_at: string;
};

export const SCORE_LABELS: Record<number, string> = {
  1: "Insuffisant",
  2: "À améliorer",
  3: "Satisfaisant",
  4: "Bien",
  5: "Excellent",
};

export const CRITERIA_LABELS = {
  score_quality: "Qualité du travail",
  score_punctuality: "Ponctualité & présence",
  score_teamwork: "Travail en équipe",
  score_initiative: "Initiative & autonomie",
  score_objectives: "Atteinte des objectifs",
} as const;

export type CriteriaKey = keyof typeof CRITERIA_LABELS;

export function getOverallLabel(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Bien";
  if (score >= 2.5) return "Satisfaisant";
  if (score >= 1.5) return "À améliorer";
  return "Insuffisant";
}
