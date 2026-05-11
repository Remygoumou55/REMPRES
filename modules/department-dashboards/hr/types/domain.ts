import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";

export type HrVisualKpiSnapshot = {
  source: "dept_rh_api";
  payload: DeptKpiPayload;
  correlationId: string;
  generatedAtIso: string;
};

export type WorkforceKpiKey =
  | "activeEmployees"
  | "presentToday"
  | "pendingLeaves"
  | "pipelineCandidates"
  | "pendingHires";

export type WorkforceAiInsight = {
  id: string;
  title: string;
  summary: string;
  confidence?: number;
};
