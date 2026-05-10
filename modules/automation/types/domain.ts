import type { Database } from "@/types/database.types";

export type AutomationWorkflowDefinitionRow =
  Database["public"]["Tables"]["erp_automation_workflow_definitions"]["Row"];
export type AutomationWorkflowRunRow =
  Database["public"]["Tables"]["erp_automation_workflow_runs"]["Row"];
export type AutomationEventRow = Database["public"]["Tables"]["erp_automation_events"]["Row"];
export type AutomationScheduleRow = Database["public"]["Tables"]["erp_automation_schedules"]["Row"];
