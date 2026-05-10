"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const AiWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function AiWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return <AiWorkspaceContext.Provider value={{ canOperate }}>{children}</AiWorkspaceContext.Provider>;
}

export function useAiWorkspace(): Ctx {
  return useContext(AiWorkspaceContext);
}
