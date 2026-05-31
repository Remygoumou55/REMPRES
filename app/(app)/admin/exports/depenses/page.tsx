import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertSuperAdminArchivesAdmin } from "@/lib/server/archives";
import {
  fetchExportHubExpenses,
  firstDayOfMonthIso,
  todayIsoDate,
} from "@/lib/admin/export-hub-data";
import { AdminExportHubPanel } from "@/components/admin/exports/AdminExportHubPanel";
import { DepensesExportButton } from "@/components/finance/DepensesExportButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Export dépenses — Admin",
};

type PageProps = {
  searchParams?: {
    from?: string;
    to?: string;
  };
};

function formatPeriodLabel(from: string, to: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  return `Période du ${fmt(from)} au ${fmt(to)}`;
}

export default async function AdminExportDepensesPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertSuperAdminArchivesAdmin(user.id);

  const from = searchParams?.from?.trim() || firstDayOfMonthIso();
  const to = searchParams?.to?.trim() || todayIsoDate();
  const expenses = await fetchExportHubExpenses(from, to);

  return (
    <AdminExportHubPanel
      title="Export dépenses (Finance)"
      description="Dépenses enregistrées sur la période sélectionnée. Idéal pour contrôle interne, clôture ou partage avec la comptabilité."
      count={expenses.length}
      countLabel={`dépense${expenses.length > 1 ? "s" : ""} sur la période`}
      periodHint={formatPeriodLabel(from, to)}
      exportAction={<DepensesExportButton expenses={expenses} />}
      filters={
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="block text-xs font-medium text-gray-600">
            Du
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Au
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Actualiser la période
          </button>
        </form>
      }
    />
  );
}
