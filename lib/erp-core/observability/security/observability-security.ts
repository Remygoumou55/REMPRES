/**
 * P8 — Résolution accès observabilité (runtime serveur).
 */

import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { hasAdminConsoleAccess } from "@/lib/auth/permissions";
import { ROLE_KEYS } from "@/lib/auth/roles";
import { getModulePermissions, getProfileAuthBrief } from "@/lib/server/permissions";
import {
  OBSERVABILITY_SECURITY_MODEL,
  type ObservabilityVisibilityScope,
} from "@/lib/erp-core/observability/security/observability-security-model";

export type { ObservabilityVisibilityScope } from "@/lib/erp-core/observability/security/observability-security-model";
export {
  OBSERVABILITY_SECURITY_MODEL,
  eventTypeAllowedForScope,
  filterByObservabilityScope,
} from "@/lib/erp-core/observability/security/observability-security-model";

export async function resolveObservabilityVisibilityScope(
  userId: string,
): Promise<ObservabilityVisibilityScope> {
  const [brief, obsPerms] = await Promise.all([
    getProfileAuthBrief(userId),
    getModulePermissions(userId, ["observability"]),
  ]);

  if (brief.roleKey === ROLE_KEYS.SUPER_ADMIN) {
    return {
      roleClass: "super_admin",
      mode: "all",
      allowedPrefixes: null,
      payloadRedaction: "none",
    };
  }
  if (brief.ok && hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) {
    return {
      roleClass: "admin_console",
      mode: "all",
      allowedPrefixes: null,
      payloadRedaction: "none",
    };
  }
  if (obsPerms.canRead) {
    return {
      roleClass: "platform_observability",
      mode: "all",
      allowedPrefixes: null,
      payloadRedaction: "none",
    };
  }

  const dept = normalizeDepartmentKey(brief.departmentKey);

  if (dept === DEPARTMENT_KEYS.FINANCE) {
    return {
      roleClass: "finance",
      mode: "domain_prefixes",
      allowedPrefixes: ["finance.", "approval."],
      payloadRedaction: "metadata_only",
    };
  }
  if (dept === DEPARTMENT_KEYS.RH) {
    return {
      roleClass: "hr",
      mode: "domain_prefixes",
      allowedPrefixes: ["hr.", "approval."],
      payloadRedaction: "metadata_only",
    };
  }
  if (dept === DEPARTMENT_KEYS.VENTE) {
    return {
      roleClass: "vente",
      mode: "domain_prefixes",
      allowedPrefixes: ["crm.", "approval."],
      payloadRedaction: "metadata_only",
    };
  }

  return {
    roleClass: "viewer",
    mode: "domain_prefixes",
    allowedPrefixes: ["approval."],
    payloadRedaction: "metadata_only",
  };
}

export async function assertErpObservabilityReadAccess(
  userId: string,
): Promise<ObservabilityVisibilityScope> {
  const scope = await resolveObservabilityVisibilityScope(userId);
  const matrix = OBSERVABILITY_SECURITY_MODEL.find((r) => r.roleClass === scope.roleClass);
  if (!matrix?.canAccessApi && scope.roleClass === "viewer") {
    throw new Error("erp_observability:read_forbidden");
  }
  const hasDomainAccess =
    scope.mode === "all" || (scope.allowedPrefixes != null && scope.allowedPrefixes.length > 0);
  if (!hasDomainAccess) {
    throw new Error("erp_observability:read_forbidden");
  }
  return scope;
}
