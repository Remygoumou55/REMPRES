"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const ComplianceWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function ComplianceWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <ComplianceWorkspaceContext.Provider value={{ canOperate }}>
      {children}
    </ComplianceWorkspaceContext.Provider>
  );
}

export function useComplianceWorkspace(): Ctx {
  return useContext(ComplianceWorkspaceContext);
}
