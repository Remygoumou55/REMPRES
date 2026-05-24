/**
 * Architecture certification registry — Bloc 2 Étape 5.
 * Evidence-driven matrix ; pas de hardcode success.
 */
export const ARCHITECTURE_CERTIFICATION_VERSION = "architecture-certification-v1" as const;

/** Pipeline authority verrouillé (Étapes 1–4). */
export const ARCHITECTURE_TOPOLOGY = {
  profile: "lib/auth/profile-authority.ts",
  layoutAccess: "lib/server/layout-access.ts",
  shell: "app/(app)/layout.tsx → AppShell",
  navigation: "lib/navigation/navigation-authority.ts",
  cockpit: "lib/navigation/cockpit-authority.ts",
  shellAuthority: "lib/navigation/shell-authority.ts",
  adminRegistry: "lib/navigation/admin-route-registry.ts",
  platformRegistry: "lib/navigation/platform-route-registry.ts",
  performance: "lib/performance/runtime-performance-registry.ts",
} as const;

export type ArchCertArea =
  | "structure"
  | "navigation"
  | "cockpit"
  | "shell"
  | "runtime"
  | "performance"
  | "platform"
  | "super_admin_lock"
  | "legacy";

export type ArchCertResult = "pass" | "fail";

export type ArchCertMatrixRow = {
  area: ArchCertArea;
  expected: string;
  actual: string;
  result: ArchCertResult;
};

/** Bloc 2 étapes certifiées (référence documentaire). */
export const BLOC2_STAGE_VERDICTS = {
  etape1_audit: "PARTIAL",
  etape2_legacy: "CLEANED",
  etape3_nav_cockpit: "UNIFIED",
  etape4_performance: "OPTIMIZED",
} as const;

/** Dette résiduelle documentée — non bloquante certification. */
export const RESIDUAL_ARCH_DEBT = [
  {
    id: "D1",
    item: "Mobile drawer ouvert = 2 instances sidebar temporaires",
    severity: "low",
  },
  {
    id: "D2",
    item: "admin/currency — composant sans page (alias settings/rates)",
    severity: "low",
  },
  {
    id: "D3",
    item: "erp/observability — route technique hors hub admin platform",
    severity: "low",
  },
  {
    id: "D4",
    item: "RUM production non instrumenté",
    severity: "low",
  },
  {
    id: "D5",
    item: "modules/ parallèle app/ (ownership partiel, hors scope Bloc 2)",
    severity: "medium",
  },
] as const;
