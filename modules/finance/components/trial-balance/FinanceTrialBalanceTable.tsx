import type { FinanceTrialBalanceViewRow } from "@/modules/finance/server/repositories/finance-trial-balance-repository";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";

export function FinanceTrialBalanceTable({ rows }: { rows: FinanceTrialBalanceViewRow[] }) {
  if (!rows.length) {
    return (
      <FinanceScrollTable emptyLabel="Pas encore de balance — postez des écritures pour alimenter la vue." />
    );
  }

  const debitSum = rows.reduce((s, r) => s + Number(r.debit_total_gnf), 0);
  const creditSum = rows.reduce((s, r) => s + Number(r.credit_total_gnf), 0);

  return (
    <div className="space-y-3">
      <FinanceScrollTable>
        <table className="min-w-[720px] w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="border-b px-3 py-2 font-medium">Compte</th>
              <th className="border-b px-3 py-2 font-medium">Type</th>
              <th className="border-b px-3 py-2 font-medium text-right">Débit</th>
              <th className="border-b px-3 py-2 font-medium text-right">Crédit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account_id} className="border-b border-gray-100 hover:bg-gray-50/80">
                <td className="px-3 py-2.5">
                  <span className="font-mono text-xs text-gray-900">{r.account_code}</span>
                  <span className="ml-2 text-gray-600">{r.account_label}</span>
                </td>
                <td className="px-3 py-2.5 text-xs capitalize text-gray-600">{r.account_type}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">
                  {Number(r.debit_total_gnf).toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">
                  {Number(r.credit_total_gnf).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-2 text-gray-800" colSpan={2}>
                Totaux
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{debitSum.toLocaleString("fr-FR")}</td>
              <td className="px-3 py-2 text-right tabular-nums">{creditSum.toLocaleString("fr-FR")}</td>
            </tr>
          </tfoot>
        </table>
      </FinanceScrollTable>
      <p className="text-xs text-gray-500">
        Les totaux doivent être égaux lorsque le journal est entièrement migré — écart résiduel = travaux en
        cours.
      </p>
    </div>
  );
}
