/**
 * P8 — Modèle sécurité observabilité (pur — safe tests).
 */

export const OBSERVABILITY_SECURITY_MODEL_VERSION = "observability-security-p8-v1" as const;

export type ObservabilityRoleClass =
  | "super_admin"
  | "platform_observability"
  | "admin_console"
  | "finance"
  | "hr"
  | "vente"
  | "viewer";

export type ObservabilityVisibilityScope = {
  roleClass: ObservabilityRoleClass;
  mode: "all" | "domain_prefixes";
  allowedPrefixes: readonly string[] | null;
  payloadRedaction: "none" | "metadata_only";
};

export type ObservabilitySecurityMatrixRow = {
  roleClass: ObservabilityRoleClass;
  visibility: string;
  eventPrefixes: string;
  classification: "public" | "restricted" | "cross_domain";
  canAccessApi: boolean;
};

export const OBSERVABILITY_SECURITY_MODEL: readonly ObservabilitySecurityMatrixRow[] = [
  {
    roleClass: "super_admin",
    visibility: "Tout le bus ERP",
    eventPrefixes: "*",
    classification: "cross_domain",
    canAccessApi: true,
  },
  {
    roleClass: "platform_observability",
    visibility: "Module observability platform",
    eventPrefixes: "*",
    classification: "cross_domain",
    canAccessApi: true,
  },
  {
    roleClass: "admin_console",
    visibility: "Console admin",
    eventPrefixes: "*",
    classification: "cross_domain",
    canAccessApi: true,
  },
  {
    roleClass: "finance",
    visibility: "Département Finance",
    eventPrefixes: "finance.*, approval.*",
    classification: "restricted",
    canAccessApi: true,
  },
  {
    roleClass: "hr",
    visibility: "Département RH",
    eventPrefixes: "hr.*, approval.*",
    classification: "restricted",
    canAccessApi: true,
  },
  {
    roleClass: "vente",
    visibility: "Département Vente",
    eventPrefixes: "crm.*, approval.*",
    classification: "restricted",
    canAccessApi: true,
  },
  {
    roleClass: "viewer",
    visibility: "Lecture minimale",
    eventPrefixes: "approval.*",
    classification: "public",
    canAccessApi: false,
  },
] as const;

export function eventTypeAllowedForScope(
  eventType: string,
  scope: ObservabilityVisibilityScope,
): boolean {
  if (scope.mode === "all" || !scope.allowedPrefixes?.length) return true;
  return scope.allowedPrefixes.some(
    (p) => eventType === p.replace(/\.$/, "") || eventType.startsWith(p),
  );
}

export function filterByObservabilityScope<T extends { eventType?: string; type?: string }>(
  items: readonly T[],
  scope: ObservabilityVisibilityScope,
  typeKey: "eventType" | "type" = "eventType",
): T[] {
  if (scope.mode === "all") return [...items];
  return items.filter((item) => {
    const t = String(item[typeKey] ?? item.eventType ?? item.type ?? "");
    return eventTypeAllowedForScope(t, scope);
  });
}
