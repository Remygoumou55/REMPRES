import type { Database } from "@/types/database.types";

export type ComplianceAccountingPeriodRow =
  Database["public"]["Tables"]["erp_compliance_accounting_periods"]["Row"];
export type ComplianceFiscalLockRow =
  Database["public"]["Tables"]["erp_compliance_fiscal_locks"]["Row"];
export type ComplianceRetentionPolicyRow =
  Database["public"]["Tables"]["erp_compliance_retention_policies"]["Row"];
export type ComplianceSnapshotRow = Database["public"]["Tables"]["erp_compliance_snapshots"]["Row"];
export type ComplianceRiskSignalRow =
  Database["public"]["Tables"]["erp_compliance_risk_signals"]["Row"];
export type ComplianceSodRuleRow = Database["public"]["Tables"]["erp_compliance_sod_rules"]["Row"];
export type ComplianceLegalTraceRow =
  Database["public"]["Tables"]["erp_compliance_legal_traces"]["Row"];
export type ComplianceExportManifestRow =
  Database["public"]["Tables"]["erp_compliance_export_manifests"]["Row"];
