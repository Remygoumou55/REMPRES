/**
 * Shell authority — Bloc 2 Étape 3.
 * AppShell = coque unique (app/(app)/layout.tsx) ; pas de second shell métier.
 */
export const SHELL_AUTHORITY_VERSION = "shell-unification-v1" as const;

export const SHELL_RUNTIME = {
  layout: "app/(app)/layout.tsx",
  component: "AppShell",
  accessLoader: "lib/server/layout-access.ts",
  providers: "app/providers.tsx",
  sidebarResolver: "lib/navigation/navigation-authority.ts",
} as const;

export type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";

export { resolveShellVisibility, resolveShellRailVisibility } from "@/lib/navigation/shell-visibility";
