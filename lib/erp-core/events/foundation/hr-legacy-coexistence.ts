/**
 * P7 — HR_COEXISTENCE_STRATEGY (pas de suppression brutale).
 */

export const HR_LEGACY_COEXISTENCE_VERSION = "hr-legacy-coexistence-p9-v1" as const;

export type HrLegacyCoexistenceRow = {
  mechanism: string;
  location: string;
  status: "active" | "parallel" | "retire_after_handler";
  retireCondition: string;
};

export const HR_LEGACY_COEXISTENCE_TABLE: readonly HrLegacyCoexistenceRow[] = [
  {
    mechanism: "tryCreateAlert rh_contract_renewal_due",
    location: "modules/hr/contracts/server/actions/contract-actions.ts",
    status: "retire_after_handler",
    retireCondition: "P7.3 — remplacé par emitHrContractExpiring + bridge",
  },
  {
    mechanism: "tryCreateAlert rh_contract_* (pending/expired/terminated/renewed)",
    location: "modules/hr/contracts/server/actions/contract-actions.ts",
    status: "retire_after_handler",
    retireCondition: "P9 — hr.contract.* + bridge",
  },
  {
    mechanism: "tryCreateAlert rh_recruitment_hire_pending",
    location: "modules/hr/recruitment/server/actions/recruitment-actions.ts",
    status: "retire_after_handler",
    retireCondition: "P9 — hr.recruitment.hire_submitted + bridge",
  },
  {
    mechanism: "ContractRealtimeBridge (Supabase)",
    location: "modules/hr/contracts/components/realtime/",
    status: "parallel",
    retireCondition: "Conserver — complète bus, pas remplace",
  },
  {
    mechanism: "SQL approval sync contrat",
    location: "supabase/sql/044_rh_contract_approval_sync.sql",
    status: "active",
    retireCondition: "Jamais — SoT activation ; event hr.contract.created = signal",
  },
  {
    mechanism: "submitRhLeaveRequestAction direct Supabase",
    location: "app/(app)/rh/actions.ts",
    status: "active",
    retireCondition: "P7.1 — gate + emitHrLeaveRequested parallèle alert",
  },
  {
    mechanism: "rh-foundation hub KPIs",
    location: "lib/server/rh-foundation.ts",
    status: "active",
    retireCondition: "Jamais — runtime read SoT",
  },
  {
    mechanism: "HR visual placeholders",
    location: "modules/department-dashboards/hr/visual/",
    status: "parallel",
    retireCondition: "Foundation validée P7 avant expansion UI",
  },
] as const;

export const HR_COEXISTENCE_STRATEGY = {
  version: HR_LEGACY_COEXISTENCE_VERSION,
  rule: "foundation_validated_before_expansion",
  placeholderRetention: ["hr visual", "rh-dept-kpi health placeholder"],
  busWiringOrder: ["taxonomy P7", "publishers P7", "mutations P7.1", "bridge P7.2", "automation P7.3"],
} as const;
