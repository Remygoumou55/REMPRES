import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getFinanceCashflowDailyRange } from "@/modules/finance/server/repositories/finance-cashflow-repository";
import { FinanceCashflowSection } from "@/modules/finance/components/treasury/FinanceCashflowSection";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { FinanceStatCard } from "@/modules/finance/ui/cards/FinanceStatCard";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fortyFiveDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 45);
  return d.toISOString().slice(0, 10);
}

export default async function FinanceEnterpriseCashflowDashboardPage() {
  const supabase = getSupabaseServerClient();
  const from = fortyFiveDaysAgo();
  const to = today();
  const rows = await getFinanceCashflowDailyRange(supabase, from, to);

  const last = rows.length ? rows[rows.length - 1] : null;
  const chartPoints = rows.map((r) => ({
    date: r.snapshot_date,
    closing: Number(r.closing_balance_gnf),
  }));

  const sumIn = rows.reduce((s, r) => s + Number(r.inflow_gnf), 0);
  const sumOut = rows.reduce((s, r) => s + Number(r.outflow_gnf), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cashflow"
        subtitle="Lecture opérationnelle des snapshots — pour la vue CFO enrichie, utilisez le pilotage principal."
        actions={
          <Link
            href="/finance"
            className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Pilotage CFO
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <FinanceStatCard
          label="Dernière clôture"
          value={last ? Number(last.closing_balance_gnf).toLocaleString("fr-FR") + " GNF" : "—"}
        />
        <FinanceStatCard label="Entrées cumulées (période)" value={sumIn.toLocaleString("fr-FR") + " GNF"} />
        <FinanceStatCard label="Sorties cumulées (période)" value={sumOut.toLocaleString("fr-FR") + " GNF"} />
      </div>

      <SectionPanel title="Net visualisé" description={`${from} → ${to}`}>
        <FinanceCashflowSection points={chartPoints} />
      </SectionPanel>
    </div>
  );
}
