import type { Database } from "@/types/database.types";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";

type Row = Database["public"]["Tables"]["finance_journal_batches"]["Row"];

function statusTone(status: Row["status"]): string {
  switch (status) {
    case "posted":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "voided":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-amber-50 text-amber-900 border-amber-200";
  }
}

export function FinanceJournalTable({ rows }: { rows: Row[] }) {
  if (!rows.length) {
    return <FinanceScrollTable emptyLabel="Aucun lot journal pour le moment." />;
  }

  return (
    <FinanceScrollTable>
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="border-b px-3 py-2 font-medium">Date pièce</th>
            <th className="border-b px-3 py-2 font-medium">Référence</th>
            <th className="border-b px-3 py-2 font-medium">Statut</th>
            <th className="border-b px-3 py-2 font-medium">Comptabilisé</th>
            <th className="border-b px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
              <td className="px-3 py-2.5 tabular-nums text-gray-800">{r.booking_date}</td>
              <td className="px-3 py-2.5 font-mono text-xs text-gray-700">{r.reference || "—"}</td>
              <td className="px-3 py-2.5">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusTone(r.status)}`}
                >
                  {r.status}
                </span>
              </td>
              <td className="px-3 py-2.5 text-xs text-gray-600">
                {r.posted_at ? new Date(r.posted_at).toLocaleString("fr-FR") : "—"}
              </td>
              <td className="max-w-[280px] truncate px-3 py-2.5 text-gray-600">{r.description ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </FinanceScrollTable>
  );
}
