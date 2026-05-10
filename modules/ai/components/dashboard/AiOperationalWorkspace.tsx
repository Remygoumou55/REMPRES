"use client";

import type { ReactNode } from "react";
import { AiOperationalNav } from "@/modules/ai/components/dashboard/AiOperationalNav";
import { AiWorkspaceProvider } from "@/modules/ai/components/dashboard/AiWorkspaceProvider";

export function AiOperationalWorkspace({
  children,
  canOperate,
}: {
  children: ReactNode;
  canOperate: boolean;
}) {
  return (
    <AiWorkspaceProvider canOperate={canOperate}>
      <div className="mx-auto max-w-6xl space-y-5">
        <AiOperationalNav />
        {children}
      </div>
    </AiWorkspaceProvider>
  );
}
