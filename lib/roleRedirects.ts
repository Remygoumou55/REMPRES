/**
 * Redirection post-login — délègue à `home-route.ts` (M3 / M3.5).
 */
import {
  resolvePostLoginRoute,
} from "@/lib/navigation/home-route";

/**
 * Destination après authentification selon rôle et département principal.
 */
export function getPostLoginDestination(
  roleKey: string | null | undefined,
  departmentKey?: string | null,
  systemAuthority?: string | null,
): string {
  return resolvePostLoginRoute(roleKey, departmentKey, systemAuthority);
}

/** @deprecated Utiliser `getPostLoginDestination(role_key, department_key)`. */
export function getDestinationForRole(
  roleKey: string | null | undefined,
  departmentKey?: string | null,
  systemAuthority?: string | null,
): string {
  return getPostLoginDestination(roleKey, departmentKey, systemAuthority);
}
