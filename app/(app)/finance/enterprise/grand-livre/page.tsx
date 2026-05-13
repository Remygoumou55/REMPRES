import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { parseFinanceIsoDate } from "@/lib/finance-query-params";
import { listFinanceGeneralLedger } from "@/modules/finance/server/repositories/finance-ledger-repository";
import { FinanceLedgerTable } from "@/modules/finance/components/ledger/FinanceLedgerTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampOrder(from: string, to: string): { from: string; to: string } {
  if (from > to) return { from: to, to: from };
  return { from, to };
}

type PageProps = {
  searchParams?: { from?: string; to?: string };
};

export default async function FinanceEnterpriseLedgerPage({ searchParams }: PageProps) {
  const t = today();
  const rawFrom = parseFinanceIsoDate(searchParams?.from, firstDayOfMonth());
  const rawTo = parseFinanceIsoDate(searchParams?.to, t);
  const { from, to } = clampOrder(rawFrom, rawTo);

  const supabase = getSupabaseServerClient();
  const rows = await listFinanceGeneralLedger(supabase, from, to, 500);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Grand livre"
        subtitle="Écritures postées uniquement — filtre par période."
      />

      <FilterPanelShell title="Période">
      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500" htmlFor="gl-from">
            Du
          </label>
          <input
            id="gl-from"
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500" htmlFor="gl-to">
            Au
          </label>
          <input
            id="gl-to"
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          Filtrer
        </button>
      </form>
      </FilterPanelShell>

      <SectionPanel title={`Mouvements ${from} → ${to}`}>
        <FinanceLedgerTable rows={rows} />
      </SectionPanel>
    </div>
  );
}
