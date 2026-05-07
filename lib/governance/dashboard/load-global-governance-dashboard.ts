import { aggregateGlobalGovernanceKpi } from "@/lib/governance/kpi/aggregate-kpi";

export async function loadGlobalGovernanceDashboard() {
  return aggregateGlobalGovernanceKpi();
}
