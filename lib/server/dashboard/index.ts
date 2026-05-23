export { getUserDisplay, getUserDisplayWithClient } from "../get-user-display";
export type { UserDisplay } from "../get-user-display";
export { getRecentActivity } from "../get-recent-activity";
export { loadAccueilDashboard } from "./load-accueil-metrics";
export type { AccueilDashboardBundle, AccueilMetrics } from "./load-accueil-metrics";
export {
  getGreeting,
  currentMonthRange,
  safeCount,
  safeSum,
  safeRows,
  safeFirst,
} from "@/lib/utils/safe-query";
