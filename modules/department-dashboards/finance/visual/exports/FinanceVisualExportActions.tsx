"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

export function FinanceVisualExportActions() {
  const { t } = useTranslation();
  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("finance.visual.exports.title", "Finance exports")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/finance/enterprise/reporting"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("finance.visual.exports.reporting", "Reporting center")}
        </Link>
        <Link
          href="/finance/enterprise/cashflow"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("finance.visual.exports.cashflow", "Cashflow center")}
        </Link>
        <Link
          href="/finance/enterprise/budgets"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("finance.visual.exports.budgets", "Budget tracking")}
        </Link>
      </div>
    </section>
  );
}
