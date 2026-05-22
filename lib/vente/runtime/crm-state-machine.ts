/**
 * B2.1 — State machine CRM (aligné B1.5 §5).
 */

export const CRM_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
] as const;

export type CrmLeadStatus = (typeof CRM_LEAD_STATUSES)[number];

export const CRM_LEAD_TERMINAL: ReadonlySet<CrmLeadStatus> = new Set<CrmLeadStatus>([
  "converted",
  "lost",
]);

const LEAD_TRANSITIONS: Record<CrmLeadStatus, readonly CrmLeadStatus[]> = {
  new: ["contacted", "qualified", "lost"],
  contacted: ["qualified", "lost"],
  qualified: ["converted", "lost"],
  converted: [],
  lost: [],
};

export function assertLeadStatusTransition(from: CrmLeadStatus, to: CrmLeadStatus): void {
  if (from === to) return;
  if (CRM_LEAD_TERMINAL.has(from)) {
    throw new Error(`crm:lead_terminal:${from}`);
  }
  const allowed = LEAD_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`crm:lead_transition_forbidden:${from}->${to}`);
  }
}

export const CRM_QUOTE_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted",
] as const;

export type CrmQuoteStatus = (typeof CRM_QUOTE_STATUSES)[number];

export const CRM_QUOTE_TERMINAL: ReadonlySet<CrmQuoteStatus> = new Set<CrmQuoteStatus>([
  "rejected",
  "expired",
  "converted",
]);

const QUOTE_TRANSITIONS: Record<CrmQuoteStatus, readonly CrmQuoteStatus[]> = {
  draft: ["sent", "rejected"],
  sent: ["accepted", "rejected", "expired"],
  accepted: ["converted"],
  rejected: [],
  expired: [],
  converted: [],
};

export function assertQuoteStatusTransition(from: CrmQuoteStatus, to: CrmQuoteStatus): void {
  if (from === to) return;
  if (CRM_QUOTE_TERMINAL.has(from)) {
    throw new Error(`crm:quote_terminal:${from}`);
  }
  const allowed = QUOTE_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(`crm:quote_transition_forbidden:${from}->${to}`);
  }
}

export function isTerminalPipelineStage(stage: {
  is_terminal_win: boolean;
  is_terminal_loss: boolean;
}): boolean {
  return stage.is_terminal_win || stage.is_terminal_loss;
}
