import type { ContractHistoryEvent } from "@/modules/hr/contracts/types";

export function buildContractTimeline(events: ContractHistoryEvent[]) {
  return [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

