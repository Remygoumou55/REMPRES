"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const ObservabilityWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function ObservabilityWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <ObservabilityWorkspaceContext.Provider value={{ canOperate }}>
      {children}
    </ObservabilityWorkspaceContext.Provider>
  );
}

export function useObservabilityWorkspace(): Ctx {
  return useContext(ObservabilityWorkspaceContext);
}
