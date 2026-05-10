"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const PlatformWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function PlatformWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <PlatformWorkspaceContext.Provider value={{ canOperate }}>{children}</PlatformWorkspaceContext.Provider>
  );
}

export function usePlatformWorkspace(): Ctx {
  return useContext(PlatformWorkspaceContext);
}
