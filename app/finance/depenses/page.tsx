import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import {
  getExpenseStats,
  listExpenseCategories,
  listExpenses,
} from "@/lib/server/expenses";
import { DepensesClient } from "./DepensesClient";

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type Search = {
  page?: string;
  from?: string;
  to?: string;
  categoryId?: string;
  pageSize?: string;
};

export default async function DepensesPage({ searchParams }: { searchParams: Search }) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const perms = await getModulePermissions(auth.user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  const from = searchParams.from || firstDayOfMonth();
  const to = searchParams.to || today();
  const categoryId = searchParams.categoryId?.trim() || undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSizeRaw = Number(searchParams.pageSize);
  const pageSize: 10 | 25 | 50 = [10, 25, 50].includes(pageSizeRaw) ? (pageSizeRaw as 10 | 25 | 50) : 25;

  const [categories, list, stats, userIsSuper] = await Promise.all([
    listExpenseCategories(),
    listExpenses({ page, pageSize, from, to, categoryId }),
    getExpenseStats({ from, to, categoryId }),
    isSuperAdmin(auth.user.id),
  ]);

  return (
    <DepensesClient
      list={list}
      categories={categories}
      stats={stats}
      filters={{ from, to, categoryId }}
      canCreate={perms.canCreate}
      canUpdate={perms.canUpdate}
      canDelete={perms.canDelete}
      currentUserId={auth.user.id}
      isSuperAdmin={userIsSuper}
    />
  );
}
