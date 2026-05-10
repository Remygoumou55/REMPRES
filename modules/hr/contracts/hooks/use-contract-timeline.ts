"use client";

import { useMemo } from "react";
import type { ContractHistoryEvent } from "@/modules/hr/contracts/types";
import { buildContractTimeline } from "@/modules/hr/contracts/timeline/build-contract-timeline";

export function useContractTimeline(events: ContractHistoryEvent[]) {
  return useMemo(() => buildContractTimeline(events), [events]);
}

