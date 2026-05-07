import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import type { ApprovalPolicy } from "@/lib/approvals/approval-types";

type Rule = {
  policy: ApprovalPolicy;
  allowRoles?: readonly string[];
};

export const APPROVAL_RULES: Record<string, Rule> = {
  [AUDIT_EVENT_TYPES.SALE_DELETED]: {
    policy: "governance_required",
    allowRoles: ["super_admin"],
  },
  [AUDIT_EVENT_TYPES.BULK_OPERATION]: {
    policy: "governance_required",
    allowRoles: ["super_admin"],
  },
  [AUDIT_EVENT_TYPES.USER_ROLE_CHANGED]: {
    policy: "governance_required",
    allowRoles: ["super_admin"],
  },
  [AUDIT_EVENT_TYPES.EXPENSE_UPDATED]: {
    policy: "governance_required",
    allowRoles: ["super_admin", "manager", "accountant"],
  },
  [AUDIT_EVENT_TYPES.CLIENT_DELETED]: {
    policy: "governance_required",
    allowRoles: ["super_admin", "manager", "agent"],
  },
  [AUDIT_EVENT_TYPES.PRODUCT_ARCHIVED]: {
    policy: "governance_required",
    allowRoles: ["super_admin", "manager", "agent"],
  },
};
