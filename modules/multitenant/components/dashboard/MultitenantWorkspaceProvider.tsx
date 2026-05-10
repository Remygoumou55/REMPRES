"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Ctx = { canOperate: boolean };

const MultitenantWorkspaceContext = createContext<Ctx>({ canOperate: false });

export function MultitenantWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <MultitenantWorkspaceContext.Provider value={{ canOperate }}>
      {children}
    </MultitenantWorkspaceContext.Provider>
  );
}

export function useMultitenantWorkspace(): Ctx {
  return useContext(MultitenantWorkspaceContext);
}
