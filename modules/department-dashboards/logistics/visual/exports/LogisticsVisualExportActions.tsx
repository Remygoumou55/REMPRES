"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

export function LogisticsVisualExportActions() {
  const { t } = useTranslation();
  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("logistics.visual.exports.title", "Logistics exports")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/logistique/reporting"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("logistics.visual.exports.reporting", "Reporting center")}
        </Link>
        <Link
          href="/logistique/livraisons"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("logistics.visual.exports.deliveries", "Delivery center")}
        </Link>
        <Link
          href="/logistique/stock"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("logistics.visual.exports.stock", "Stock center")}
        </Link>
      </div>
    </section>
  );
}
