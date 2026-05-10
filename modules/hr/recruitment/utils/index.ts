import type { PipelineStage } from "@/modules/hr/recruitment/constants";

const ORDER: PipelineStage[] = ["sourced", "screening", "interview", "offer"];

export function isFrozenPipelineStage(stage: PipelineStage): boolean {
  return (
    stage === "hired" ||
    stage === "withdrawn" ||
    stage === "rejected" ||
    stage === "pending_hire_approval"
  );
}

/** Avance contrôlée dans le pipeline (sans embauche ni pending approval). */
export function isAllowedPipelineAdvance(from: PipelineStage, to: PipelineStage): boolean {
  if (from === to) return false;
  if (from === "pending_hire_approval" || from === "hired") return false;
  if (to === "hired" || to === "pending_hire_approval") return false;
  if (to === "rejected" || to === "withdrawn") return true;

  const fi = ORDER.indexOf(from);
  const ti = ORDER.indexOf(to);
  if (fi < 0 || ti < 0) return false;
  return ti === fi + 1;
}
