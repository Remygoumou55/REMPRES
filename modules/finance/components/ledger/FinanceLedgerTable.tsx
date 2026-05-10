import type { FinanceGeneralLedgerViewRow } from "@/modules/finance/server/repositories/finance-ledger-repository";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";

export function FinanceLedgerTable({ rows }: { rows: FinanceGeneralLedgerViewRow[] }) {
  if (!rows.length) {
    return (
      <FinanceScrollTable emptyLabel="Aucune écriture postée sur cette période (grand livre vide)." />
    );
  }

  return (
    <FinanceScrollTable>
      <table className="min-w-[960px] w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="border-b px-3 py-2 font-medium">Date</th>
            <th className="border-b px-3 py-2 font-medium">Compte</th>
            <th className="border-b px-3 py-2 font-medium">D/C</th>
            <th className="border-b px-3 py-2 font-medium text-right">Montant GNF</th>
            <th className="border-b px-3 py-2 font-medium">Référence lot</th>
            <th className="border-b px-3 py-2 font-medium">Mémo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.line_id} className="border-b border-gray-100 hover:bg-gray-50/80">
              <td className="px-3 py-2.5 tabular-nums text-gray-800">{r.booking_date}</td>
              <td className="px-3 py-2.5">
                <span className="font-mono text-xs text-gray-800">{r.account_code}</span>
                <span className="ml-2 text-gray-600">{r.account_label}</span>
              </td>
              <td className="px-3 py-2.5 font-semibold tabular-nums text-gray-800">{r.debit_credit}</td>
              <td className="px-3 py-2.5 text-right tabular-nums font-medium text-darktext">
                {Number(r.amount_gnf).toLocaleString("fr-FR")}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{r.batch_reference || "—"}</td>
              <td className="max-w-[220px] truncate px-3 py-2.5 text-xs text-gray-600">{r.memo ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </FinanceScrollTable>
  );
}
