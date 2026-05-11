/** Couche insights exécutifs — alimentation future depuis `/admin/ai` et pipelines prédictifs. */
export type ExecutiveAiInsight = {
  id: string;
  title: string;
  narrative: string;
  severity?: "info" | "attention" | "critical";
  href?: string;
};
