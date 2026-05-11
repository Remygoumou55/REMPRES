"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lazy-load générique pour surfaces lourdes (Recharts, PDF preview) — même stratégie que les dashboards métier.
 */
export function createDeferredSurface<P extends object>(
  importer: () => Promise<{ default: ComponentType<P> }>,
  displayName: string,
) {
  const Lazy = dynamic(importer, {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full rounded-card" />,
  });
  function DeferredSurface(props: P) {
    return <Lazy {...props} />;
  }
  DeferredSurface.displayName = displayName;
  return DeferredSurface;
}
