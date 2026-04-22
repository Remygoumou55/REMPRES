#!/usr/bin/env node

/**
 * Usage (PowerShell):
 *   $env:SESSION_COOKIE="sb-access-token=...; sb-refresh-token=..."
 *   node scripts/test-signed-audit-export.mjs
 *
 * Optional:
 *   $env:BASE_URL="http://localhost:3000"
 *   $env:EXPORT_QUERY="moduleKey=clients&actionKey=delete"
 */

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const sessionCookie = process.env.SESSION_COOKIE;
const exportQuery = process.env.EXPORT_QUERY ?? "";

if (!sessionCookie) {
  console.error("Missing SESSION_COOKIE environment variable.");
  process.exit(1);
}

function buildUrl(path, query = "") {
  return `${baseUrl}${path}${query ? `?${query}` : ""}`;
}

async function callJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Cookie: sessionCookie,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { response, data };
}

async function main() {
  const exportUrl = buildUrl("/admin/activity-logs/export-json", exportQuery);
  const verifyUrl = buildUrl("/admin/activity-logs/verify-json");

  const exported = await callJson(exportUrl, { method: "GET" });
  if (!exported.response.ok || !exported.data) {
    console.error("Export failed:", exported.response.status, exported.data);
    process.exit(1);
  }

  const verified = await callJson(verifyUrl, {
    method: "POST",
    body: JSON.stringify(exported.data),
  });

  if (!verified.data) {
    console.error("Verify failed: invalid JSON response.", verified.response.status);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        exportStatus: exported.response.status,
        verifyStatus: verified.response.status,
        valid: Boolean(verified.data.valid),
        algorithm: verified.data.algorithm ?? null,
        providedHash: verified.data.providedHash ?? null,
        expectedHash: verified.data.expectedHash ?? null,
      },
      null,
      2,
    ),
  );

  process.exit(verified.data.valid ? 0 : 2);
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exit(1);
});
