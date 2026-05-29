#!/usr/bin/env node
/**
 * Phase 1.2 — Inventaire reproductible des checks legacy (role_key / super_admin).
 * Usage: node scripts/audit/phase1-legacy-inventory.mjs
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const OUT_DIR = join(ROOT, "docs", "governance");
const OUT_FILE = join(OUT_DIR, "phase1-legacy-inventory.json");

const SKIP = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);

const PATTERNS = [
  { id: "role_key_literal", re: /role_key\s*===|role_key\s*==|\.eq\(\s*['"]role_key['"]/g },
  { id: "super_admin_string", re: /super_admin|superadmin/gi },
  { id: "system_authority", re: /system_authority|hasSystemRootAuthority/g },
  { id: "legacy_responsable", re: /responsable_|directeur_/g },
  { id: "canAccessPath", re: /canAccessPathForProfile|edgeCanAccessPathForProfile/g },
  { id: "rempres_role_cookie", re: /rempres_role/g },
  { id: "department_key_gate", re: /department_key\s*===|normalizeDepartmentKey\(/g },
];

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, files);
    else if (/\.(ts|tsx|sql)$/.test(e.name)) files.push(p);
  }
  return files;
}

function countMatches(content, re) {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const globalRe = new RegExp(re.source, flags);
  return [...content.matchAll(globalRe)].length;
}

async function main() {
  const files = await walk(ROOT);
  const byPattern = Object.fromEntries(PATTERNS.map((p) => [p.id, []]));
  const fileHits = [];

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (rel.startsWith("docs/governance/phase1-legacy-inventory")) continue;
    const content = await readFile(file, "utf8");
    const hits = {};
    let total = 0;
    for (const p of PATTERNS) {
      const n = countMatches(content, p.re);
      if (n > 0) {
        hits[p.id] = n;
        total += n;
        byPattern[p.id].push({ file: rel, count: n });
      }
    }
    if (total > 0) {
      const hasSa = (hits.system_authority ?? 0) > 0;
      const hasRoleOnly =
        (hits.role_key_literal ?? 0) > 0 &&
        (hits.system_authority ?? 0) === 0 &&
        !rel.includes("system-authority");
      fileHits.push({ file: rel, hits, risk: hasRoleOnly ? "HIGH" : hasSa ? "MIGRATED" : "MEDIUM" });
    }
  }

  for (const k of Object.keys(byPattern)) {
    byPattern[k].sort((a, b) => b.count - a.count);
  }
  fileHits.sort((a, b) => {
    const riskOrder = { HIGH: 0, MEDIUM: 1, MIGRATED: 2 };
    return (riskOrder[a.risk] ?? 9) - (riskOrder[b.risk] ?? 9);
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    filesScanned: files.length,
    filesWithHits: fileHits.length,
    highRiskFiles: fileHits.filter((f) => f.risk === "HIGH").length,
    patternTotals: Object.fromEntries(
      PATTERNS.map((p) => [p.id, byPattern[p.id].reduce((s, x) => s + x.count, 0)]),
    ),
    topHighRisk: fileHits.filter((f) => f.risk === "HIGH").slice(0, 40),
    byPattern,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Wrote ${relative(ROOT, OUT_FILE)}`);
  console.log(`High-risk files: ${summary.highRiskFiles} / ${summary.filesWithHits}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
