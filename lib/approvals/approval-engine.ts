import { APPROVAL_RULES } from "@/lib/approvals/approval-rules";
import type { ApprovalContext, ApprovalDecision } from "@/lib/approvals/approval-types";

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? "").trim().toLowerCase();
}

function isStrictMode(): boolean {
  return String(process.env.ERP_APPROVAL_STRICT ?? "")
    .trim()
    .toLowerCase() === "true";
}

export function evaluateApproval(ctx: ApprovalContext): ApprovalDecision {
  const role = normalizeRole(ctx.actorRole);
  const rule = APPROVAL_RULES[ctx.eventType];

  if (!rule) {
    return {
      required: false,
      granted: true,
      policy: "soft_auto",
      reason: "No explicit approval rule for this event.",
    };
  }

  if (!rule.allowRoles || rule.allowRoles.includes(role)) {
    return {
      required: rule.policy === "governance_required",
      granted: true,
      policy: rule.policy,
      reason: "Allowed by governance role policy.",
    };
  }

  if (!isStrictMode()) {
    return {
      required: true,
      granted: true,
      policy: "soft_auto",
      reason: "Strict approval mode disabled; soft-pass for backward compatibility.",
    };
  }

  return {
    required: true,
    granted: false,
    policy: "governance_required",
    reason: "Actor role is not authorized by approval policy.",
  };
}

export function assertApprovalOrThrow(ctx: ApprovalContext): ApprovalDecision {
  const decision = evaluateApproval(ctx);
  if (!decision.granted) {
    throw new Error("Action sensible bloquée par la gouvernance d'approbation.");
  }
  return decision;
}
