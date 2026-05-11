/**
 * Phase 1 : la source de vérité KPI département reste `GET /api/dept/[deptKey]/kpis`.
 * Les repositories SQL directs seront branchés ici si un worker interne évite le fetch HTTP.
 */
export const DASHBOARD_DEPT_KPI_REMOTE_READ_PLACEHOLDER = true;
