import type {
  GovernanceAlertCategory,
  GovernanceAlertEscalation,
  GovernanceAlertSeverity,
} from "@/lib/governance/alerts/types";

export type GovernanceAlertDefinition = {
  type: string;
  titleKey: string;
  descriptionKey: string;
  category: GovernanceAlertCategory;
  severity: GovernanceAlertSeverity;
  escalation: GovernanceAlertEscalation;
};

const ALERT_DEFINITIONS: Record<string, GovernanceAlertDefinition> = {
  approval_request_created: {
    type: "approval_request_created",
    titleKey: "governance.alerts.type.approvalRequestCreated.title",
    descriptionKey: "governance.alerts.type.approvalRequestCreated.description",
    category: "GOVERNANCE",
    severity: "high",
    escalation: "dg_only",
  },
  approval_granted: {
    type: "approval_granted",
    titleKey: "governance.alerts.type.approvalGranted.title",
    descriptionKey: "governance.alerts.type.approvalGranted.description",
    category: "GOVERNANCE",
    severity: "medium",
    escalation: "dg_only",
  },
  approval_rejected: {
    type: "approval_rejected",
    titleKey: "governance.alerts.type.approvalRejected.title",
    descriptionKey: "governance.alerts.type.approvalRejected.description",
    category: "GOVERNANCE",
    severity: "critical",
    escalation: "dg_only",
  },
  security_access_denied: {
    type: "security_access_denied",
    titleKey: "governance.alerts.type.securityAccessDenied.title",
    descriptionKey: "governance.alerts.type.securityAccessDenied.description",
    category: "SECURITY",
    severity: "critical",
    escalation: "dg_only",
  },
};

export function getAlertDefinition(type: string): GovernanceAlertDefinition {
  return (
    ALERT_DEFINITIONS[type] ?? {
      type,
      titleKey: "governance.alerts.type.generic.title",
      descriptionKey: "governance.alerts.type.generic.description",
      category: "SYSTEM",
      severity: "medium",
      escalation: "manager_and_dg",
    }
  );
}
