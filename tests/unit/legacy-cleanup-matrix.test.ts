import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { isAdminRouteKept } from "@/lib/navigation/admin-route-registry";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Legacy cleanup matrix — Bloc 2 Étape 2", () => {
  const matrix: Array<{
    area: string;
    expected: string;
    check: () => boolean;
  }> = [
    {
      area: "SA cockpit",
      expected: "SuperAdminCockpitClient inchangé",
      check: () => readSrc("app/(app)/dashboard/page.tsx").includes("SuperAdminCockpitClient"),
    },
    {
      area: "SA sidebar",
      expected: "ErpNavSidebar",
      check: () => readSrc("components/layout/app-shell.tsx").includes("ErpNavSidebar"),
    },
    {
      area: "Dept cockpit",
      expected: "DeptHomePage sur /dept/[key]",
      check: () => readSrc("app/(app)/dept/[deptKey]/page.tsx").includes("DeptHomePage"),
    },
    {
      area: "Orphan placeholder",
      expected: "DepartmentCockpitPlaceholder supprimé",
      check: () => !existsSync(join(ROOT, "components/cockpit/DepartmentCockpitPlaceholder.tsx")),
    },
    {
      area: "Orphan VenteCockpitClient",
      expected: "module UI supprimé",
      check: () =>
        !existsSync(join(ROOT, "modules/vente/components/cockpit/VenteCockpitClient.tsx")),
    },
    {
      area: "Admin KEEP",
      expected: "/admin/approvals conservé",
      check: () => isAdminRouteKept("/admin/approvals"),
    },
    {
      area: "Admin DELETE",
      expected: "/admin/cloud/ai legacy supprimé",
      check: () => !isAdminRouteKept("/admin/cloud/ai"),
    },
    {
      area: "Admin page file",
      expected: "cloud/ai page.tsx absent",
      check: () => !existsSync(join(ROOT, "app/(app)/admin/cloud/ai/page.tsx")),
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
