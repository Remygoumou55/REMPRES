"use client";

import type { ReactNode } from "react";
import { ResilienceOperationalNav } from "@/modules/resilience/components/dashboard/ResilienceOperationalNav";
import { ResilienceWorkspaceProvider } from "@/modules/resilience/components/dashboard/ResilienceWorkspaceProvider";

export function ResilienceOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <ResilienceWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <ResilienceOperationalNav />
        {children}
      </div>
    </ResilienceWorkspaceProvider>
  );
}
