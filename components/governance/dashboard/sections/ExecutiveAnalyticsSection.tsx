import Link from "next/link";

type ExecutiveAnalyticsSectionProps = {
  t: (key: string) => string;
};

export function ExecutiveAnalyticsSection({ t }: ExecutiveAnalyticsSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.dashboard.executiveAnalytics.title")}</h2>
      <p className="mt-1 text-sm text-gray-600">{t("governance.dashboard.executiveAnalytics.subtitle")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/admin/intelligence"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
        >
          {t("governance.dashboard.executiveAnalytics.openIntelligence")}
        </Link>
        <Link
          href="/admin/approvals"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
        >
          {t("governance.dashboard.executiveAnalytics.openApprovals")}
        </Link>
        <Link
          href="/admin/alerts"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
        >
          {t("governance.dashboard.executiveAnalytics.openAlerts")}
        </Link>
      </div>
    </section>
  );
}
