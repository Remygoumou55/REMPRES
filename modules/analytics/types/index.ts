export type { RhDeptKpisDigestV1 } from "@/modules/analytics/types/rh-digest";

export type AnalyticsSnapshotRow = {
  scope_key: string;
  payload: unknown;
  computed_at: string;
};
