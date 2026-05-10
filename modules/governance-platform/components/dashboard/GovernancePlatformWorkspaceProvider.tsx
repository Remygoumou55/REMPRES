"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const GovernancePlatformWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function GovernancePlatformWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <GovernancePlatformWorkspaceContext.Provider value={{ canOperate }}>
      {children}
    </GovernancePlatformWorkspaceContext.Provider>
  );
}

export function useGovernancePlatformWorkspace(): Ctx {
  return useContext(GovernancePlatformWorkspaceContext);
}
