import Link from "next/link";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

/** Point d’entrée UI comptabilité (plan comptable / exports techniques). */
export function FinanceAccountingOverview({ accountCount }: { accountCount: number }) {
  return (
    <SectionPanel
      title="Comptabilité générale"
      description={`${accountCount} comptes actifs synchronisés avec le référentiel.`}
    >
      <div className="flex flex-wrap gap-3">
        <Link
          href="/finance/enterprise/grand-livre"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-darktext hover:bg-gray-50"
        >
          Grand livre
        </Link>
        <Link
          href="/finance/enterprise/balance"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-darktext hover:bg-gray-50"
        >
          Balance
        </Link>
        <Link
          href="/api/finance/enterprise/accounts"
          prefetch={false}
          className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          JSON plan comptable
        </Link>
      </div>
    </SectionPanel>
  );
}
