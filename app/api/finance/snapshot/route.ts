import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import { getFinanceCfoData } from "@/lib/server/finance-overview";
import { parseCategoryIds, parseCreatedBy, parseFinanceIsoDate } from "@/lib/finance-query-params";
import { reportMutationError } from "@/lib/monitoring/error-monitor";
import { nowMs, reportIfSlow } from "@/lib/monitoring/performance-monitor";

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampOrder(from: string, to: string): { from: string; to: string } {
  if (from > to) return { from: to, to: from };
  return { from, to };
}

/**
 * Rafraîchissement JSON (même agrégation que la page /finance) — sans rechargement RSC.
 */
export async function GET(request: Request) {
  const startedAt = nowMs();
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const perms = await getModulePermissions(auth.user.id, ["finance"]);
  if (!perms.canRead) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const superAdmin = await isSuperAdmin(auth.user.id);
  const url = new URL(request.url);
  const t = today();
  const { from, to } = clampOrder(
    parseFinanceIsoDate(url.searchParams.get("from"), firstDayOfMonth()),
    parseFinanceIsoDate(url.searchParams.get("to"), t),
  );
  const allCat = url.searchParams.getAll("category");
  const categoryIds = parseCategoryIds(allCat.length ? allCat : url.searchParams.get("category") ?? undefined);
  const createdByUserId = parseCreatedBy(
    url.searchParams.get("createdBy") ?? undefined,
    superAdmin,
  );

  try {
    const data = await getFinanceCfoData(supabase, {
      from,
      to,
      categoryIds,
      createdByUserId,
    });
    reportIfSlow("api_finance_snapshot", startedAt, 900, {
      from,
      to,
      categoryCount: categoryIds.length,
      hasCreatedBy: !!createdByUserId,
    });
    return NextResponse.json(
      { data, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    reportMutationError("api_finance_snapshot", error, {
      from,
      to,
      categoryCount: categoryIds.length,
      hasCreatedBy: !!createdByUserId,
    });
    return NextResponse.json(
      { error: "Impossible de charger les données finance." },
      { status: 500 },
    );
  }
}
