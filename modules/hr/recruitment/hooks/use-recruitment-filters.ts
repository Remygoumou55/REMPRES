"use client";

import { useMemo, useState } from "react";
import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";

export function useRecruitmentFilters(candidates: RecruitmentCandidate[]) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const byStage = !stage || c.pipelineStage === stage;
      const byText =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q);
      return byStage && byText;
    });
  }, [candidates, query, stage]);
  return { query, setQuery, stage, setStage, filtered };
}
