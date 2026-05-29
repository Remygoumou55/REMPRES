/** En-têtes injectés par le middleware après lecture profil — évite une 2e requête DB dans le layout RSC. */
export const PROFILE_HEADER_UID = "x-rempres-uid";
export const PROFILE_HEADER_ROLE = "x-rempres-role";
export const PROFILE_HEADER_DEPT_KEY = "x-rempres-dept-key";
export const PROFILE_HEADER_DEPT_ID = "x-rempres-dept-id";
export const PROFILE_HEADER_ACTIVE = "x-rempres-active";
export const PROFILE_HEADER_FNAME = "x-rempres-fname";
export const PROFILE_HEADER_LNAME = "x-rempres-lname";
export const PROFILE_HEADER_EMAIL = "x-rempres-email";
export const PROFILE_HEADER_LANG = "x-rempres-lang";
export const PROFILE_HEADER_SYS_AUTH = "x-rempres-sys-auth";

import { decodeHeaderText, encodeHeaderText } from "@/lib/utils/display-text";

export { decodeHeaderText } from "@/lib/utils/display-text";

export type MiddlewareProfileSlice = {
  userId: string;
  roleKey: string | null;
  systemAuthority?: string | null;
  departmentKey: string | null;
  departmentId: string | null;
  isActive: boolean;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  preferredLanguage: string | null;
};

export function applyProfileHeaders(headers: Headers, profile: MiddlewareProfileSlice): void {
  headers.set(PROFILE_HEADER_UID, profile.userId);
  headers.set(PROFILE_HEADER_ROLE, profile.roleKey ?? "");
  headers.set(PROFILE_HEADER_DEPT_KEY, profile.departmentKey ?? "");
  headers.set(PROFILE_HEADER_DEPT_ID, profile.departmentId ?? "");
  headers.set(PROFILE_HEADER_ACTIVE, profile.isActive ? "1" : "0");
  headers.set(PROFILE_HEADER_FNAME, encodeHeaderText(profile.firstName));
  headers.set(PROFILE_HEADER_LNAME, encodeHeaderText(profile.lastName));
  headers.set(PROFILE_HEADER_EMAIL, encodeHeaderText(profile.email));
  headers.set(PROFILE_HEADER_LANG, profile.preferredLanguage ?? "");
}

export function readProfileHeaders(
  headers: Headers,
  expectedUserId: string,
): MiddlewareProfileSlice | null {
  const uid = headers.get(PROFILE_HEADER_UID);
  if (!uid || uid !== expectedUserId) return null;

  const roleRaw = headers.get(PROFILE_HEADER_ROLE);
  const sysAuthRaw = headers.get(PROFILE_HEADER_SYS_AUTH);
  const deptKeyRaw = headers.get(PROFILE_HEADER_DEPT_KEY);
  const deptIdRaw = headers.get(PROFILE_HEADER_DEPT_ID);

  return {
    userId: uid,
    roleKey: roleRaw?.trim() ? roleRaw.trim() : null,
    systemAuthority: sysAuthRaw?.trim() ? sysAuthRaw.trim() : null,
    departmentKey: deptKeyRaw?.trim() ? deptKeyRaw.trim() : null,
    departmentId: deptIdRaw?.trim() ? deptIdRaw.trim() : null,
    isActive: headers.get(PROFILE_HEADER_ACTIVE) !== "0",
    firstName: decodeHeaderText(headers.get(PROFILE_HEADER_FNAME)),
    lastName: decodeHeaderText(headers.get(PROFILE_HEADER_LNAME)),
    email: decodeHeaderText(headers.get(PROFILE_HEADER_EMAIL)),
    preferredLanguage: headers.get(PROFILE_HEADER_LANG)?.trim() || null,
  };
}
