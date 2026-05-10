"use client";

import { useMemo } from "react";
import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";
import { computeRecruitmentMetrics } from "@/modules/hr/recruitment/analytics/recruitment-metrics";

export function useRecruitmentAnalytics(candidates: RecruitmentCandidate[]) {
  return useMemo(() => computeRecruitmentMetrics(candidates), [candidates]);
}
