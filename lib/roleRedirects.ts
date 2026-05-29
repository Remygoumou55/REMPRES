/**
 * Redirection post-login — délègue à Authorization Core (Phase 2).
 */
import {
  resolveAuthenticatedLanding,
  resolveAuthenticatedSafeHome,
  toPlatformAuthorityProfile,
} from "@/lib/auth/authorization-core";

export type PostLoginProfileSlice = {
  role_key?: string | null;
  department_key?: string | null;
  system_authority?: string | null;
};

export function profileSliceToAuthority(slice: PostLoginProfileSlice | null | undefined) {
  return toPlatformAuthorityProfile({
    roleKey: slice?.role_key ?? null,
    departmentKey: slice?.department_key ?? null,
    systemAuthority: slice?.system_authority ?? null,
  });
}

/**
 * Destination après authentification selon autorité système + rôle + département.
 */
export function getPostLoginDestination(
  roleKey: string | null | undefined,
  departmentKey?: string | null,
  systemAuthority?: string | null,
): string {
  return resolveAuthenticatedLanding(
    toPlatformAuthorityProfile({ roleKey, departmentKey, systemAuthority }),
  );
}

/** Destination depuis ligne profil Supabase (login SSR / callback). */
export function getPostLoginDestinationFromProfile(
  profile: PostLoginProfileSlice | null | undefined,
): string {
  return resolveAuthenticatedLanding(profileSliceToAuthority(profile));
}

export function getSafeHomeFromProfile(profile: PostLoginProfileSlice | null | undefined): string {
  return resolveAuthenticatedSafeHome(profileSliceToAuthority(profile));
}

/** @deprecated Utiliser `getPostLoginDestination` avec system_authority. */
export function getDestinationForRole(
  roleKey: string | null | undefined,
  departmentKey?: string | null,
  systemAuthority?: string | null,
): string {
  return getPostLoginDestination(roleKey, departmentKey, systemAuthority);
}
