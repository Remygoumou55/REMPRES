import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { listActiveFinanceAccounts } from "@/modules/finance/server/repositories/finance-accounts-repository";
import { assertFinanceRead } from "@/modules/finance/server/security/assert-finance-read";

/** Liste plan comptable actif (Finance Enterprise) — lecture seule, permissions finance.read */
export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const perms = await getModulePermissions(auth.user.id, ["finance"]);
  try {
    assertFinanceRead(perms);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accounts = await listActiveFinanceAccounts(supabase);
    return NextResponse.json(
      { accounts, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
