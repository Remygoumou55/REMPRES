/**
 * Auth routes worker internes — réutilise le secret cron analytics (`INTERNAL_ANALYTICS_SECRET`)
 * pour éviter une proliferation de headers/env tout en gardant les endpoints séparés.
 */
export {
  verifyInternalAnalyticsSecret as verifyInternalInfrastructureWorker,
} from "@/modules/analytics/server/security/verify-internal-analytics-secret";
