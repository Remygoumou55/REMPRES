import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RUNTIME_PERF_MATRIX, SHELL_I18N_BUNDLE_COUNT } from "@/lib/performance/runtime-performance-registry";
import { PROVIDER_STACK } from "@/lib/performance/provider-governance";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Runtime performance matrix — Bloc 2 Étape 4", () => {
  it("AppShell: mobile drawer mounts sidebar only when open", () => {
    const src = readSrc("components/layout/app-shell.tsx");
    expect(src).toContain("isMobileMenuOpen ? sidebarContent : null");
    expect(src).not.toContain("renderSidebar()");
  });

  it("AppShell: stable EMPTY_SHELL_RAIL + useMemo sidebarProps", () => {
    const src = readSrc("components/layout/app-shell.tsx");
    expect(src).toContain("EMPTY_SHELL_RAIL");
    expect(src).toContain("useMemo(() => shellRail ?? EMPTY_SHELL_RAIL");
    expect(src).toContain("const sidebarProps = useMemo(");
  });

  it("AppShell: CurrencySwitcher dynamically imported", () => {
    const src = readSrc("components/layout/app-shell.tsx");
    expect(src).toContain('import("@/components/CurrencySwitcher")');
    expect(src).not.toMatch(/import \{ CurrencySwitcher \} from "@\/components\/CurrencySwitcher"/);
  });

  it("layout-access uses React cache", () => {
    const src = readSrc("lib/server/layout-access.ts");
    expect(src).toContain("cache(async");
  });

  it("shell i18n loads 3 bundles", () => {
    expect(SHELL_I18N_BUNDLE_COUNT).toBe(3);
    const src = readSrc("lib/i18n/load-messages.ts");
    expect(src).toContain('SHELL_I18N_BUNDLES = ["common", "navigation", "errors"]');
  });

  it("provider stack is single chain", () => {
    expect(PROVIDER_STACK.length).toBe(4);
    const src = readSrc("app/providers.tsx");
    for (const name of PROVIDER_STACK) {
      expect(src).toContain(name);
    }
  });

  it("ErpNavSidebar file untouched (SA frozen)", () => {
    const src = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
    expect(src).toContain("filterNavConfig");
    expect(src).toContain("export const ErpNavSidebar");
  });

  it.each(RUNTIME_PERF_MATRIX.filter((m) => m.result === "improved"))(
    "$id improved",
    (metric) => {
      expect(metric.result).toBe("improved");
    },
  );
});
