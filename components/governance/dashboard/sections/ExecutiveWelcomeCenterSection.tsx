type ExecutiveWelcomeCenterSectionProps = {
  t: (key: string) => string;
  activeDepartments: number;
  unresolvedAlerts: number;
  pendingApprovals: number;
};

export function ExecutiveWelcomeCenterSection({
  t,
  activeDepartments,
  unresolvedAlerts,
  pendingApprovals,
}: ExecutiveWelcomeCenterSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{t("governance.dashboard.welcome.title")}</h2>
      <p className="mt-1 text-sm text-gray-600">{t("governance.dashboard.welcome.subtitle")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {t("governance.dashboard.welcome.activeDepartments")}{" "}
          <span className="font-semibold">{activeDepartments}</span>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t("governance.dashboard.welcome.pendingValidations")}{" "}
          <span className="font-semibold">{pendingApprovals}</span>
        </div>
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {t("governance.dashboard.welcome.criticalIssues")}{" "}
          <span className="font-semibold">{unresolvedAlerts}</span>
        </div>
      </div>
    </section>
  );
}
