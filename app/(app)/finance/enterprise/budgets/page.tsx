import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { countFinanceBudgetLinesForBudget, listFinanceBudgets } from "@/modules/finance/server/repositories/finance-budgets-repository";
import {
  FinanceBudgetsTable,
  type BudgetRowWithLines,
} from "@/modules/finance/components/budgets/FinanceBudgetsTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default async function FinanceEnterpriseBudgetsPage() {
  const supabase = getSupabaseServerClient();
  const budgets = await listFinanceBudgets(supabase, 40);

  const rows: BudgetRowWithLines[] = await Promise.all(
    budgets.map(async (b) => ({
      ...b,
      lineCount: await countFinanceBudgetLinesForBudget(supabase, b.id),
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets" subtitle="Enveloppes et lignes analytiques (catégories / comptes)." />
      <SectionPanel title="Budgets structurés">
        <FinanceBudgetsTable rows={rows} />
      </SectionPanel>
    </div>
  );
}
