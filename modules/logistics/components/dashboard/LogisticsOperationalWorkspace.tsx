"use client";

import type { ReactNode } from "react";
import { LogisticsOperationalNav } from "@/modules/logistics/components/dashboard/LogisticsOperationalNav";

export function LogisticsOperationalWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <LogisticsOperationalNav />
      {children}
    </div>
  );
}
