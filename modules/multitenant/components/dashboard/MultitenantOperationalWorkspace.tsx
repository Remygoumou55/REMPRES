"use client";

import type { ReactNode } from "react";
import { MultitenantOperationalNav } from "@/modules/multitenant/components/dashboard/MultitenantOperationalNav";
import { MultitenantWorkspaceProvider } from "@/modules/multitenant/components/dashboard/MultitenantWorkspaceProvider";

export function MultitenantOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <MultitenantWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <MultitenantOperationalNav />
        {children}
      </div>
    </MultitenantWorkspaceProvider>
  );
}
