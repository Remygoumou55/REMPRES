import type { DashboardDateRangePreset, DashboardGlobalFilterState } from "../types/domain";

export type DashboardFilterBarProps = {
  value: DashboardGlobalFilterState;
  onChange: (next: DashboardGlobalFilterState) => void;
  disabled?: boolean;
};

export type DatePresetOption = {
  id: DashboardDateRangePreset;
  labelKey: string;
};
