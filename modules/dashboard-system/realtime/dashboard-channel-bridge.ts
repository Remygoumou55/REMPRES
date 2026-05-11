import { REALTIME_CHANNELS } from "@/lib/realtime/channels";

/**
 * Cartographie étendue sans nouveau canal physique :
 * les écrans dashboard peuvent invalider React Query sur signaux métier existants.
 */
export const DASHBOARD_REALTIME_BRIDGE = {
  governanceAlerts: REALTIME_CHANNELS.governance.alerts,
  governanceApprovals: REALTIME_CHANNELS.governance.approvals,
  rhContracts: REALTIME_CHANNELS.rh.contracts,
  rhRecruitment: REALTIME_CHANNELS.rh.recruitment,
} as const;
