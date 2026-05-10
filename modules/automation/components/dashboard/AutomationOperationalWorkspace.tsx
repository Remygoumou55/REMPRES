"use client";

import type { ReactNode } from "react";
import { AutomationOperationalNav } from "@/modules/automation/components/dashboard/AutomationOperationalNav";
import { AutomationWorkspaceProvider } from "@/modules/automation/components/dashboard/AutomationWorkspaceProvider";

export function AutomationOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <AutomationWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <AutomationOperationalNav />
        {children}
      </div>
    </AutomationWorkspaceProvider>
  );
}
