/**
 * Bloc 3 — Publishers officiels — Operations / Project.
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { OPERATIONS_DEPARTMENT_KEY } from "@/modules/operations/constants/module-keys";

export async function emitOpsTaskCreated(params: {
  actorUserId: string;
  taskId: string;
  taskCode: string;
  title: string;
  projectId?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_tasks",
    entityId: params.taskId,
    correlationId: params.taskId,
    payload: {
      task_code: params.taskCode,
      title: params.title,
      project_id: params.projectId ?? null,
    },
  });
}

export async function emitOpsTaskAssigned(params: {
  actorUserId: string;
  taskId: string;
  assigneeUserId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_ASSIGNED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_tasks",
    entityId: params.taskId,
    correlationId: params.taskId,
    payload: { assignee_user_id: params.assigneeUserId },
  });
}

export async function emitOpsTaskCompleted(params: {
  actorUserId: string;
  taskId: string;
  taskCode: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_COMPLETED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_tasks",
    entityId: params.taskId,
    correlationId: params.taskId,
    payload: { task_code: params.taskCode },
  });
}

export async function emitOpsWorkflowStarted(params: {
  actorUserId: string;
  workflowId: string;
  workflowCode: string;
  subjectType: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_WORKFLOW_STARTED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_workflows",
    entityId: params.workflowId,
    correlationId: params.workflowId,
    payload: {
      workflow_code: params.workflowCode,
      subject_type: params.subjectType,
    },
  });
}

export async function emitOpsWorkflowApproved(params: {
  actorUserId: string;
  workflowId: string;
  workflowCode: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_WORKFLOW_APPROVED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_workflows",
    entityId: params.workflowId,
    correlationId: params.workflowId,
    payload: { workflow_code: params.workflowCode },
  });
}

export async function emitOpsProjectCreated(params: {
  actorUserId: string;
  projectId: string;
  projectCode: string;
  title: string;
  ownerUserId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_PROJECT_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_projects",
    entityId: params.projectId,
    correlationId: params.projectId,
    payload: {
      project_code: params.projectCode,
      title: params.title,
      owner_user_id: params.ownerUserId,
    },
  });
}

export async function emitOpsDeliveryCompleted(params: {
  actorUserId: string;
  deliveryId: string;
  projectId: string;
  milestoneKey: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_DELIVERY_COMPLETED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_deliveries",
    entityId: params.deliveryId,
    correlationId: params.deliveryId,
    payload: {
      project_id: params.projectId,
      milestone_key: params.milestoneKey,
    },
  });
}

export async function emitOpsExecutionDelayed(params: {
  actorUserId: string;
  deliveryId: string;
  projectId: string;
  delayReason: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_EXECUTION_DELAYED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "erp_ops_deliveries",
    entityId: params.deliveryId,
    correlationId: params.deliveryId,
    payload: {
      project_id: params.projectId,
      delay_reason: params.delayReason,
    },
  });
}

export async function emitOpsReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  periodStart: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.OPS_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: OPERATIONS_DEPARTMENT_KEY,
    entityType: "ops_analytics_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: { period_start: params.periodStart },
  });
}
