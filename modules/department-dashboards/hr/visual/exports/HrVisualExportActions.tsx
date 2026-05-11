"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

export function HrVisualExportActions() {
  const { t } = useTranslation();
  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("rh.visual.exports.title", "HR exports & executive packs")}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href="/api/rh/export?format=csv"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("rh.visual.exports.csv", "Export CSV")}
        </a>
        <Link
          href="/rh/contrats"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("rh.visual.exports.contracts", "Contracts center")}
        </Link>
        <Link
          href="/rh/recrutement"
          className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
        >
          {t("rh.visual.exports.recruitment", "Recruitment center")}
        </Link>
      </div>
    </section>
  );
}
