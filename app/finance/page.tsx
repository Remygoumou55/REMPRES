import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, isSuperAdmin, listProfilesForAdminSelect } from "@/lib/server/permissions";
import { getFinanceCfoData } from "@/lib/server/finance-overview";
import { getStoredRates } from "@/lib/server/currencyService";
import { listExpenseCategories } from "@/lib/server/expenses";
import { parseCategoryIds, parseCreatedBy } from "@/lib/finance-query-params";
import { FinanceDashboardClient } from "./FinanceDashboardClient";

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(s: string | undefined, fallback: string): string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return fallback;
  return s;
}

function clampOrder(from: string, to: string): { from: string; to: string } {
  if (from > to) return { from: to, to: from };
  return { from, to };
}

type PageProps = {
  searchParams: { from?: string; to?: string; category?: string | string[]; createdBy?: string };
};

export default async function FinancePage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const perms = await getModulePermissions(auth.user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  const t = today();
  const rawFrom = parseDate(searchParams.from, firstDayOfMonth());
  const rawTo = parseDate(searchParams.to, t);
  const { from, to } = clampOrder(rawFrom, rawTo);

  const superAdmin = await isSuperAdmin(auth.user.id);
  const catList = Array.isArray(searchParams.category)
    ? searchParams.category
    : searchParams.category
      ? [searchParams.category]
      : [];
  const categoryIds = parseCategoryIds(catList.length > 0 ? catList : undefined);
  const createdByUserId = parseCreatedBy(searchParams.createdBy, superAdmin);

  const [data, categoryOptions, profileOptions, currencyRates] = await Promise.all([
    getFinanceCfoData(supabase, { from, to, categoryIds, createdByUserId }),
    listExpenseCategories(),
    superAdmin ? listProfilesForAdminSelect() : Promise.resolve([] as { id: string; label: string }[]),
    getStoredRates(),
  ]);

  return (
    <FinanceDashboardClient
      data={data}
      from={from}
      to={to}
      categoryOptions={categoryOptions}
      profileOptions={profileOptions}
      canFilterByUser={superAdmin}
      selectedCategoryIds={categoryIds}
      selectedCreatedBy={createdByUserId}
      currencyRates={currencyRates}
    />
  );
}
