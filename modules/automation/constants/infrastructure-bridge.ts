/** Types jobs alignés sur `erp_infrastructure_jobs` — queue `automation`. */
export const AUTOMATION_INFRA_JOB_TYPES = {
  workflowRunTick: "automation.workflow_run_tick",
  scheduleSweep: "automation.schedule_sweep",
  escalationSweep: "automation.escalation_sweep",
} as const;
