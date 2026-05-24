import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.join(process.cwd(), "lib");

/** Fichiers autorité canoniques — seule source de vérité role/dept. */
const CANONICAL_AUTHORITY_FILES = [
  "auth/profile-authority.ts",
  "navigation/route-authority.ts",
  "navigation/sidebar-authority.ts",
];

/** Patterns interdits hors modules canoniques (vérité parallèle). */
const FORBIDDEN_PARALLEL_PATTERNS = [
  /DEPT_ALLOWED_ROUTES\[/,
  /isDeptRouteAllowed\(/,
];

const SCAN_DIRS = ["navigation", "middleware", "server", "auth"];

describe("authority drift audit (Étape 5)", () => {
  it("modules canoniques authority existent", () => {
    for (const f of CANONICAL_AUTHORITY_FILES) {
      expect(fs.existsSync(path.join(ROOT, "..", f)) || fs.existsSync(path.join(process.cwd(), "lib", f.replace("auth/", "auth/")))).toBe(true);
    }
    expect(fs.existsSync(path.join(process.cwd(), "lib/auth/profile-authority.ts"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "lib/navigation/route-authority.ts"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "lib/navigation/sidebar-authority.ts"))).toBe(true);
  });

  it("middleware ne référence plus isDeptRouteAllowed", () => {
    const mw = fs.readFileSync(path.join(process.cwd(), "middleware.ts"), "utf8");
    expect(mw).not.toContain("isDeptRouteAllowed");
    expect(mw).not.toContain("rempres_role");
  });

  it("dept-cockpit-route n'utilise plus DEPT_ALLOWED_ROUTES", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "lib/navigation/dept-cockpit-route.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/from ["']@\/lib\/constants\/role-routes/);
    expect(src).not.toMatch(/DEPT_ALLOWED_ROUTES\[/);
  });

  for (const dir of SCAN_DIRS) {
    it(`pas de vérité parallèle active dans lib/${dir} (hors deprecated)`, () => {
      const base = path.join(process.cwd(), "lib", dir);
      if (!fs.existsSync(base)) return;
      const files = walkTs(base);
      for (const file of files) {
        const rel = path.relative(path.join(process.cwd(), "lib"), file).replace(/\\/g, "/");
        if (rel.includes("role-routes.ts")) continue;
        const content = fs.readFileSync(file, "utf8");
        if (content.includes("@deprecated")) continue;
        for (const pattern of FORBIDDEN_PARALLEL_PATTERNS) {
          expect(content, `${rel} must not match ${pattern}`).not.toMatch(pattern);
        }
      }
    });
  }
});

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkTs(full));
    else if (entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}
