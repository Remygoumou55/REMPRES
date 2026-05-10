"use client";

import type { ReactNode } from "react";
import { ObservabilityOperationalNav } from "@/modules/observability/components/dashboard/ObservabilityOperationalNav";
import { ObservabilityWorkspaceProvider } from "@/modules/observability/components/dashboard/ObservabilityWorkspaceProvider";

export function ObservabilityOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <ObservabilityWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <ObservabilityOperationalNav />
        {children}
      </div>
    </ObservabilityWorkspaceProvider>
  );
}
