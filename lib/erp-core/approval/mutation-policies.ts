/**
 * B3.1 — Politiques approval par action mutation (format B2.4 `{domain}.{entity}.{verb}`).
 */

import type { ErpApprovalRule } from "@/lib/erp-core/approval/domain-model";

export const ERP_MUTATION_APPROVAL_POLICIES: Record<string, ErpApprovalRule> = {
  "crm.quote.convert_sale": {
    mutationAction: "crm.quote.convert_sale",
    policy: "governance_required",
    required: true,
    approverRoleKeys: ["super_admin", "manager"],
    description: "Conversion devis → vente (stock + FK)",
  },
  "finance.journal.post": {
    mutationAction: "finance.journal.post",
    policy: "governance_required",
    required: true,
    approverRoleKeys: ["super_admin", "manager", "accountant"],
    description: "Comptabilisation lot journal",
  },
  "finance.expense.create": {
    mutationAction: "finance.expense.create",
    policy: "threshold_required",
    required: true,
    amountThresholdGnf: 500_000,
    approverRoleKeys: ["super_admin", "manager", "accountant"],
    description: "Création dépense au-dessus du seuil",
  },
  "finance.expense.update": {
    mutationAction: "finance.expense.update",
    policy: "threshold_required",
    required: true,
    amountThresholdGnf: 500_000,
    approverRoleKeys: ["super_admin", "manager", "accountant"],
    description: "Modification dépense au-dessus du seuil",
  },
};
