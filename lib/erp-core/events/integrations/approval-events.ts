/**
 * B3.2 — Publishers officiels — famille approval (intégration B3.1).
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export async function emitApprovalRequestCreated(params: {
  actorUserId: string;
  departmentKey: string;
  requestId: string;
  mutationAction: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: params.departmentKey,
    entityType: "approval_requests",
    entityId: params.requestId,
    correlationId: params.requestId,
    payload: {
      mutationAction: params.mutationAction,
      targetEntityType: params.entityType,
      targetEntityId: params.entityId,
      ...(params.payload ?? {}),
    },
  });
}

export async function emitApprovalGateGranted(params: {
  actorUserId: string;
  departmentKey: string;
  requestId: string;
  mutationAction: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.APPROVAL_GATE_GRANTED, {
    actorUserId: params.actorUserId,
    departmentKey: params.departmentKey,
    entityType: "approval_requests",
    entityId: params.requestId,
    correlationId: params.requestId,
    payload: { mutationAction: params.mutationAction },
  });
}

export async function emitMutationBlockedPending(params: {
  actorUserId: string;
  departmentKey: string;
  requestId: string;
  mutationAction: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.MUTATION_BLOCKED_PENDING, {
    actorUserId: params.actorUserId,
    departmentKey: params.departmentKey,
    entityType: "approval_requests",
    entityId: params.requestId,
    correlationId: params.requestId,
    payload: { mutationAction: params.mutationAction },
  });
}

export async function emitApprovalRequestApproved(params: {
  approverUserId: string;
  departmentKey: string;
  requestId: string;
  mutationAction?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED, {
    actorUserId: params.approverUserId,
    departmentKey: params.departmentKey,
    entityType: "approval_requests",
    entityId: params.requestId,
    correlationId: params.requestId,
    payload: { mutationAction: params.mutationAction ?? null },
  });
}

export async function emitApprovalRequestRejected(params: {
  approverUserId: string;
  departmentKey: string;
  requestId: string;
  rejectionReason?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_REJECTED, {
    actorUserId: params.approverUserId,
    departmentKey: params.departmentKey,
    entityType: "approval_requests",
    entityId: params.requestId,
    correlationId: params.requestId,
    payload: { rejectionReason: params.rejectionReason ?? null },
  });
}
