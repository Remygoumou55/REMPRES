"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const ResilienceWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function ResilienceWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <ResilienceWorkspaceContext.Provider value={{ canOperate }}>{children}</ResilienceWorkspaceContext.Provider>
  );
}

export function useResilienceWorkspace(): Ctx {
  return useContext(ResilienceWorkspaceContext);
}
