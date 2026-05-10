import type { EmployeeHistoryEvent } from "@/modules/hr/employees/types";

export function sortEmployeeHistory(events: EmployeeHistoryEvent[]): EmployeeHistoryEvent[] {
  return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

