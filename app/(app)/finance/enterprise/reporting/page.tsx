import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { buildFinanceOperationalReport } from "@/modules/finance/server/services/finance-reporting-service";

export default async function FinanceEnterpriseReportingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["finance"]);
  if (!perms.canRead) redirect("/access-denied");

  const report = await buildFinanceOperationalReport(user.id);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Reporting financier"
        subtitle={`Periode ${report.period.from} → ${report.period.to} — donnees live`}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500">CA net</p>
          <p className="mt-1 text-xl font-bold text-darktext">
            {report.income.netSaleRevenue.toLocaleString("fr-FR")} GNF
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Depenses</p>
          <p className="mt-1 text-xl font-bold text-darktext">
            {report.expenses.total.toLocaleString("fr-FR")} GNF
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Resultat</p>
          <p className="mt-1 text-xl font-bold text-darktext">
            {report.income.profit.toLocaleString("fr-FR")} GNF
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">Cashflow net</p>
          <p className="mt-1 text-xl font-bold text-darktext">
            {report.cashflow.netInRange.toLocaleString("fr-FR")} GNF
          </p>
        </div>
      </div>

      <SectionPanel title="P&L synthese" description="Compte de resultat sur la periode selectionnee.">
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div className="flex justify-between rounded-lg border border-gray-100 px-3 py-2">
            <dt className="text-gray-600">Marge</dt>
            <dd className="font-medium text-darktext">
              {report.income.marginPct != null ? `${report.income.marginPct.toFixed(1)} %` : "—"}
            </dd>
          </div>
          <div className="flex justify-between rounded-lg border border-gray-100 px-3 py-2">
            <dt className="text-gray-600">Lignes balance</dt>
            <dd className="font-medium text-darktext">{report.balanceSummary.rowCount}</dd>
          </div>
        </dl>
      </SectionPanel>

      <SectionPanel title="Analyse depenses" description="Repartition par categorie (periode).">
        {report.expenses.byCategory.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune depense sur la periode.</p>
        ) : (
          <ul className="space-y-2">
            {report.expenses.byCategory.map((cat) => (
              <li
                key={cat.name}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </span>
                <span className="font-medium tabular-nums">{cat.amount.toLocaleString("fr-FR")} GNF</span>
              </li>
            ))}
          </ul>
        )}
      </SectionPanel>

      <SectionPanel title="Balance (extrait)" description="Grand livre agrege — comptes actifs.">
        {report.balanceSummary.rows.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune ecriture comptabilisee.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500">
                <th className="py-2">Compte</th>
                <th className="py-2">Debit</th>
                <th className="py-2">Credit</th>
              </tr>
            </thead>
            <tbody>
              {report.balanceSummary.rows.map((row) => (
                <tr key={row.code} className="border-b border-gray-50">
                  <td className="py-2">
                    {row.code} — {row.label}
                  </td>
                  <td className="py-2 tabular-nums">{row.debit.toLocaleString("fr-FR")}</td>
                  <td className="py-2 tabular-nums">{row.credit.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-gray-500">
          Totaux debit {report.balanceSummary.totalDebit.toLocaleString("fr-FR")} · credit{" "}
          {report.balanceSummary.totalCredit.toLocaleString("fr-FR")} GNF
        </p>
      </SectionPanel>

      <SectionPanel title="Exports complementaires">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>
            <Link href="/finance" className="font-medium text-primary hover:underline">
              Pilotage CFO — exports CSV/PDF
            </Link>
          </li>
          <li>
            <Link href="/finance/enterprise/grand-livre" className="text-primary hover:underline">
              Grand livre detaille
            </Link>
          </li>
          <li>
            <Link href="/finance/depenses" className="text-primary hover:underline">
              Gestion des depenses
            </Link>
          </li>
        </ul>
      </SectionPanel>
    </div>
  );
}
