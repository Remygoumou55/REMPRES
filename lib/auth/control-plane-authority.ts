/**
 * Control plane authority — Phase 4.
 * Acteurs plateforme (ROOT / SUPER_ADMIN) indépendants des départements métiers.
 */
import { hasSystemRootAuthority, type SystemAuthoritySlice } from "@/lib/auth/system-authority";
import { SUPER_ADMIN_COCKPIT_ROUTE } from "@/lib/navigation/erp-ux-architecture";

export const CONTROL_PLANE_AUTHORITY_VERSION = "control-plane-isolation-v1" as const;

export type AuthorityPlane = "control" | "business";

export type ControlPlaneSlice = SystemAuthoritySlice;

/** Acteur gouvernance plateforme — ne doit jamais hériter d'un department_key métier. */
export function isControlPlaneActor(slice: ControlPlaneSlice): boolean {
  return hasSystemRootAuthority(slice);
}

export function resolveAuthorityPlane(slice: ControlPlaneSlice): AuthorityPlane {
  return isControlPlaneActor(slice) ? "control" : "business";
}

/** Accueil canonique control plane (≠ cockpit département). */
export function resolveControlPlaneHomeRoute(): string {
  return SUPER_ADMIN_COCKPIT_ROUTE;
}

export type NavigationContext = ControlPlaneSlice & {
  plane: AuthorityPlane;
  isControlPlane: boolean;
  /** Toujours null en plane control — department_key DB ignoré pour l'autorité métier. */
  businessDepartmentKey: null;
};

/** Contexte navigation/shell — une décision, pas de fuite dept sur SA/ROOT. */
export function resolveNavigationContext(
  slice: ControlPlaneSlice,
): NavigationContext {
  const isControlPlane = isControlPlaneActor(slice);
  return {
    ...slice,
    plane: isControlPlane ? "control" : "business",
    isControlPlane,
    businessDepartmentKey: null,
  };
}

/** department_key exposé au shell chrome (présence, labels) — null si control plane. */
export function resolveShellDepartmentKey(
  slice: ControlPlaneSlice,
  rawDepartmentKey: string | null | undefined,
): string | null {
  if (isControlPlaneActor(slice)) return null;
  const k = rawDepartmentKey != null ? String(rawDepartmentKey).trim() : "";
  return k.length > 0 ? k : null;
}
