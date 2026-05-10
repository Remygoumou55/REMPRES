import type { Database } from "@/types/database.types";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";

type Row = Database["public"]["Tables"]["finance_payment_allocations"]["Row"];

export function FinancePaymentsTable({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <FinanceScrollTable emptyLabel="Aucun paiement enregistré dans les allocations." />;
  }

  return (
    <FinanceScrollTable>
      <table className="min-w-[920px] w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="border-b px-3 py-2 font-medium">Payé le</th>
            <th className="border-b px-3 py-2 font-medium text-right">Montant GNF</th>
            <th className="border-b px-3 py-2 font-medium">Mode</th>
            <th className="border-b px-3 py-2 font-medium">Référence</th>
            <th className="border-b px-3 py-2 font-medium">Cible</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
              <td className="px-3 py-2.5 text-xs text-gray-800">
                {new Date(r.paid_at).toLocaleString("fr-FR")}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums font-medium text-darktext">
                {Number(r.amount_gnf).toLocaleString("fr-FR")}
              </td>
              <td className="px-3 py-2.5 text-xs capitalize text-gray-700">{r.payment_method}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{r.reference ?? "—"}</td>
              <td className="px-3 py-2.5 text-xs text-gray-600">
                {r.invoice_id ? `Facture ${r.invoice_id.slice(0, 8)}…` : null}
                {r.expense_id ? `Dépense ${r.expense_id.slice(0, 8)}…` : null}
                {r.financial_transaction_id ? `FT ${r.financial_transaction_id.slice(0, 8)}…` : null}
                {!r.invoice_id && !r.expense_id && !r.financial_transaction_id ? "Manuel / divers" : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </FinanceScrollTable>
  );
}
