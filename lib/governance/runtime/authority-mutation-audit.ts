/**
 * Phase 3 — Audit des mutations d'autorité système (append-only gouvernance).
 */
import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";
import type { ProfileAuthoritySnapshot } from "@/lib/governance/runtime/root-protection";
import type { RootMutationIntent } from "@/lib/governance/runtime/root-protection";

export async function recordAuthorityMutationAudit(input: {
  actorUserId: string;
  actorRoleKey: string | null;
  targetUserId: string;
  before: ProfileAuthoritySnapshot;
  intent: RootMutationIntent;
  operation: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await tryLogGovernanceAuditEvent({
    category: "security",
    severity: "critical",
    actorUserId: input.actorUserId,
    actorRole: input.actorRoleKey,
    actionType: "platform_authority_mutation",
    entityType: "profiles",
    entityId: input.targetUserId,
    beforeSnapshot: {
      role_key: input.before.role_key,
      system_authority: input.before.system_authority ?? null,
      department_key: null,
      is_active: input.before.is_active ?? true,
    },
    afterSnapshot: {
      role_key: input.intent.nextRoleKey,
      system_authority: input.intent.nextSystemAuthority ?? input.before.system_authority ?? null,
      department_key: input.intent.nextDepartmentKey,
      is_active: input.intent.nextIsActive ?? input.before.is_active ?? true,
    },
    metadata: {
      operation: input.operation,
      ...input.metadata,
    },
  });
}
