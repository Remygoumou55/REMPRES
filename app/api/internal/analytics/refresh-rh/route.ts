import { NextResponse } from "next/server";
import { refreshRhDeptKpisDigestAndRevalidate } from "@/modules/analytics/server/services/rh-digest-refresh-service";
import { verifyInternalAnalyticsSecret } from "@/modules/analytics/server/security/verify-internal-analytics-secret";

export async function POST(request: Request) {
  if (!verifyInternalAnalyticsSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await refreshRhDeptKpisDigestAndRevalidate();
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
