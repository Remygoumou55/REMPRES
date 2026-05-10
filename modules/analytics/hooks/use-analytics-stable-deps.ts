"use client";

import { useMemo } from "react";

/** Mémoïse une valeur dérivée pour éviter recréations inutiles dans les hooks consommant les query keys analytics. */
export function useStableAnalyticsDeps<T>(factory: () => T, deps: readonly unknown[]): T {
  return useMemo(factory, deps);
}
