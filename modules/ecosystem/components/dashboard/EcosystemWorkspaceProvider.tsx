"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const EcosystemWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function EcosystemWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <EcosystemWorkspaceContext.Provider value={{ canOperate }}>{children}</EcosystemWorkspaceContext.Provider>
  );
}

export function useEcosystemWorkspace(): Ctx {
  return useContext(EcosystemWorkspaceContext);
}
