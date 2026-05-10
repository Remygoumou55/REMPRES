import type { Database } from "@/types/database.types";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";

type BudgetRow = Database["public"]["Tables"]["finance_budgets"]["Row"];

export type BudgetRowWithLines = BudgetRow & { lineCount: number };

export function FinanceBudgetsTable({ rows }: { rows: BudgetRowWithLines[] }) {
  if (!rows.length) {
    return <FinanceScrollTable emptyLabel="Aucun budget structuré." />;
  }

  return (
    <FinanceScrollTable>
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="border-b px-3 py-2 font-medium">Exercice</th>
            <th className="border-b px-3 py-2 font-medium">Nom</th>
            <th className="border-b px-3 py-2 font-medium">Statut</th>
            <th className="border-b px-3 py-2 font-medium">Lignes</th>
            <th className="border-b px-3 py-2 font-medium">Département</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
              <td className="px-3 py-2.5 tabular-nums font-medium text-darktext">{r.fiscal_year}</td>
              <td className="px-3 py-2.5 text-gray-800">{r.name}</td>
              <td className="px-3 py-2.5 text-xs capitalize text-gray-700">{r.status}</td>
              <td className="px-3 py-2.5 tabular-nums text-gray-700">{r.lineCount}</td>
              <td className="px-3 py-2.5 text-xs text-gray-600">{r.department_key ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </FinanceScrollTable>
  );
}
