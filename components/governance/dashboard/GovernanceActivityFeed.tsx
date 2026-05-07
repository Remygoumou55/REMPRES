"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { RecentActivityEntry } from "@/lib/server/dashboard-kpis";
import { resolveGovernanceEvent } from "@/lib/audit/event-definitions";

type GovernanceActivityFeedProps = {
  events: RecentActivityEntry[];
};

export function GovernanceActivityFeed({ events }: GovernanceActivityFeedProps) {
  const { t, locale } = useTranslation();
  const toReadable = (value: string) =>
    value
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (s) => s.toUpperCase());

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.dashboard.activityFeed.title")}</h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-600">
        {events.length === 0 ? <li>{t("governance.dashboard.activityFeed.empty")}</li> : null}
        {events.map((event) => (
          <li key={event.id} className="rounded-xl border border-gray-100 px-3 py-2">
            {(() => {
              const resolved = resolveGovernanceEvent(event.module_key, event.action_key);
              return (
                <>
            <p className="font-medium text-gray-800">
              {t(`governance.activity.module.${resolved.moduleKey}`, toReadable(resolved.moduleKey))} ·{" "}
              {t(resolved.labelKey, toReadable(resolved.actionKey))}
            </p>
            <p className="text-xs text-gray-500">
              {event.actor_display_name ?? t("governance.activity.systemActor")} ·{" "}
              {new Date(event.created_at).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
            </p>
                </>
              );
            })()}
          </li>
        ))}
      </ul>
    </section>
  );
}
