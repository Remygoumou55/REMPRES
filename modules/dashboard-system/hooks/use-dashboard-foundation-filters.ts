"use client";

import { useCallback, useState } from "react";
import type { DashboardGlobalFilterState } from "../types/domain";

const defaultState: DashboardGlobalFilterState = {
  tenantId: null,
  currencyCode: null,
  dateRange: "30d",
};

export function useDashboardFoundationFilters(initial?: Partial<DashboardGlobalFilterState>) {
  const [value, setValue] = useState<DashboardGlobalFilterState>({ ...defaultState, ...initial });
  const reset = useCallback(() => setValue({ ...defaultState }), []);
  return { value, setValue, reset };
}
