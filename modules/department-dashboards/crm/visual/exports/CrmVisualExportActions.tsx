"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

export function CrmVisualExportActions() {
  const { t } = useTranslation();
  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("crm.visual.exports.title", "CRM exports")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/vente/crm/reporting"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("crm.visual.exports.reporting", "Reporting center")}
        </Link>
        <Link
          href="/vente/crm/forecasting"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("crm.visual.exports.forecasting", "Forecasting center")}
        </Link>
        <Link
          href="/vente/crm/pipeline"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("crm.visual.exports.pipeline", "Pipeline center")}
        </Link>
      </div>
    </section>
  );
}
