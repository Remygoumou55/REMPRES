import type { RecentActivityEntry } from "@/lib/server/dashboard-kpis";

type GovernanceActivityFeedProps = {
  events: RecentActivityEntry[];
};

export function GovernanceActivityFeed({ events }: GovernanceActivityFeedProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Activite recente</h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-600">
        {events.length === 0 ? <li>Aucune activite recente.</li> : null}
        {events.map((event) => (
          <li key={event.id} className="rounded-xl border border-gray-100 px-3 py-2">
            <p className="font-medium text-gray-800">
              {event.module_key} · {event.action_key}
            </p>
            <p className="text-xs text-gray-500">
              {event.actor_display_name ?? "Systeme"} ·{" "}
              {new Date(event.created_at).toLocaleString("fr-FR")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
