/**
 * Implémentation prioritaire : Postgres (`erp_infrastructure_jobs`) via service_role pour dispatch batch.
 * Point d’extension futur : connecteurs externes sans changer les signatures `enqueueInfrastructureJob`.
 */
export { enqueueInfrastructureJob } from "@/modules/infrastructure/server/repositories/infrastructure-job-repository";
