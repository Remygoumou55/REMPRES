import type { DatePresetOption } from "./types";

/** Options UI — les labels sont des clés i18n à résoudre dans le composant appelant. */
export const DASHBOARD_DATE_PRESET_OPTIONS: readonly DatePresetOption[] = [
  { id: "7d", labelKey: "dashboard.foundation.filter.preset7d" },
  { id: "30d", labelKey: "dashboard.foundation.filter.preset30d" },
  { id: "mtd", labelKey: "dashboard.foundation.filter.presetMtd" },
  { id: "qtd", labelKey: "dashboard.foundation.filter.presetQtd" },
  { id: "ytd", labelKey: "dashboard.foundation.filter.presetYtd" },
];
