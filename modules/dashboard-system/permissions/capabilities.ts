import type { DashboardErpDomainKey } from "../types/domain";

/** Capacités fines pour composition UI — la décision d’accès reste serveur (`assertDashboardDeptRead`). */
export type DashboardCapabilityMatrix = Partial<Record<DashboardErpDomainKey, { read: boolean }>>;
