"use client";

import { useMemo } from "react";

/** Mémoïse des agrégats dérivés pour hooks dashboards / queries infra sans toucher au query engine global. */
export function useInfrastructureStableDeps<T>(factory: () => T, deps: readonly unknown[]): T {
  return useMemo(factory, deps);
}
