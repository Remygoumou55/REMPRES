"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type AutomationWorkspaceCtx = { canOperate: boolean };

const AutomationWorkspaceContext = createContext<AutomationWorkspaceCtx>({ canOperate: false });

export function AutomationWorkspaceProvider({
  canOperate,
  children,
}: {
  canOperate: boolean;
  children: ReactNode;
}) {
  return (
    <AutomationWorkspaceContext.Provider value={{ canOperate }}>
      {children}
    </AutomationWorkspaceContext.Provider>
  );
}

export function useAutomationWorkspace(): AutomationWorkspaceCtx {
  return useContext(AutomationWorkspaceContext);
}
