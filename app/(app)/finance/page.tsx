import nextDynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, isSuperAdmin, listProfilesForAdminSelect } from "@/lib/server/permissions";
import { getFinanceCfoData, listFinancialTransactionsForExport } from "@/lib/server/finance-overview";
import { listExpenseCategories } from "@/lib/server/expenses";
import { parseCategoryIds, parseCreatedBy, parseFinanceIsoDate } from "@/lib/finance-query-params";
import { RouteLoadingShell } from "@/components/ui/route-loading-shell";
import { ROUTES } from "@/lib/constants/routes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Code-split : Recharts et graphiques ne sont chargés qu’en ouvrant /finance. */
const FinanceDashboardClient = nextDynamic(
  () =>
    import("./FinanceDashboardClient").then((mod) => ({
      default: mod.FinanceDashboardClient,
    })),
  {
    ssr: true,
    loading: () => (
      <div className="py-8" aria-busy="true">
        <RouteLoadingShell label="Chargement du pilotage financier…" />
      </div>
    ),
  },
);

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

type PageProps = {
  searchParams: { from?: string; to?: string; category?: string | string[]; createdBy?: string };
};

export default async function FinancePage({ searchParams }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  const t = today();
  const rawFrom = parseFinanceIsoDate(searchParams.from, firstDayOfMonth());
  const rawTo = parseFinanceIsoDate(searchParams.to, t);
  const { from, to } = clampOrder(rawFrom, rawTo);

  const superAdmin = await isSuperAdmin(user.id);
  const catList = Array.isArray(searchParams.category)
    ? searchParams.category
    : searchParams.category
      ? [searchParams.category]
      : [];
  const categoryIds = parseCategoryIds(catList.length > 0 ? catList : undefined);
  const createdByUserId = parseCreatedBy(searchParams.createdBy, superAdmin);

  const supabase = getSupabaseServerClient();
  const [data, categoryOptions, profileOptions, transactionExportRows] =
    await Promise.all([
      getFinanceCfoData(supabase, { from, to, categoryIds, createdByUserId }),
      listExpenseCategories(),
      superAdmin ? listProfilesForAdminSelect() : Promise.resolve([] as { id: string; label: string }[]),
      listFinancialTransactionsForExport(supabase, from, to, createdByUserId).catch(() => []),
    ]);

  return (
    <div className="page-wrapper">
      <div className="-mt-2 pb-2">
        <a href={ROUTES.financeVisual} className="inline-flex text-sm font-medium text-primary hover:underline">
          Vue analytique Finance →
        </a>
      </div>
      <FinanceDashboardClient
        data={data}
        from={from}
        to={to}
        categoryOptions={categoryOptions}
        profileOptions={profileOptions}
        canFilterByUser={superAdmin}
        selectedCategoryIds={categoryIds}
        selectedCreatedBy={createdByUserId}
        transactionExportRows={transactionExportRows}
      />
    </div>
  );
}
