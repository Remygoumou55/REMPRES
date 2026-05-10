import type { ContractHistoryEvent } from "@/modules/hr/contracts/types";

export function buildContractHistory(events: ContractHistoryEvent[]) {
  return events.map((event) => ({
    ...event,
    eventLabel: String(event.eventLabel ?? "").trim() || event.eventType,
  }));
}

