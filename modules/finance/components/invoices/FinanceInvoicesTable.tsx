import type { Database } from "@/types/database.types";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";

type Row = Database["public"]["Tables"]["finance_ar_invoices"]["Row"];

export function FinanceInvoicesTable({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <FinanceScrollTable emptyLabel="Aucune facture AR saisie." />;
  }

  return (
    <FinanceScrollTable>
      <table className="min-w-[820px] w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="border-b px-3 py-2 font-medium">Numéro</th>
            <th className="border-b px-3 py-2 font-medium">Émission</th>
            <th className="border-b px-3 py-2 font-medium">Échéance</th>
            <th className="border-b px-3 py-2 font-medium">Statut</th>
            <th className="border-b px-3 py-2 font-medium text-right">Total GNF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
              <td className="px-3 py-2.5 font-mono text-xs font-medium text-darktext">{r.invoice_number}</td>
              <td className="px-3 py-2.5 tabular-nums text-gray-700">{r.issue_date}</td>
              <td className="px-3 py-2.5 tabular-nums text-gray-700">{r.due_date}</td>
              <td className="px-3 py-2.5 text-xs capitalize text-gray-700">{r.status}</td>
              <td className="px-3 py-2.5 text-right tabular-nums font-medium text-darktext">
                {Number(r.total_gnf).toLocaleString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </FinanceScrollTable>
  );
}
