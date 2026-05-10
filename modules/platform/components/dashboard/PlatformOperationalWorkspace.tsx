"use client";

import type { ReactNode } from "react";
import { PlatformOperationalNav } from "@/modules/platform/components/dashboard/PlatformOperationalNav";
import { PlatformWorkspaceProvider } from "@/modules/platform/components/dashboard/PlatformWorkspaceProvider";

export function PlatformOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <PlatformWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <PlatformOperationalNav />
        {children}
      </div>
    </PlatformWorkspaceProvider>
  );
}
