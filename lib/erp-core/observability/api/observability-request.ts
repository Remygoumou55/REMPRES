import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertErpObservabilityReadAccess } from "@/lib/erp-core/observability/security/observability-security";
import type { ObservabilityVisibilityScope } from "@/lib/erp-core/observability/security/observability-security";

export type ObservabilityRequestContext =
  | { ok: true; userId: string; scope: ObservabilityVisibilityScope }
  | { ok: false; response: NextResponse };

export async function resolveObservabilityRequest(): Promise<ObservabilityRequestContext> {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifie" }, { status: 401 }) };
  }
  try {
    const scope = await assertErpObservabilityReadAccess(auth.user.id);
    return { ok: true, userId: auth.user.id, scope };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Interdit" }, { status: 403 }) };
  }
}

export function observabilityJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
