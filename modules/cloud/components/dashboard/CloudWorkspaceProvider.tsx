"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const CloudWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function CloudWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return <CloudWorkspaceContext.Provider value={{ canOperate }}>{children}</CloudWorkspaceContext.Provider>;
}

export function useCloudWorkspace(): Ctx {
  return useContext(CloudWorkspaceContext);
}
