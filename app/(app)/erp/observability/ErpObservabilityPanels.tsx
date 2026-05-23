import type { ReactNode } from "react";
import type { ErpObservabilitySnapshot } from "@/lib/erp-core/observability/runtime/observability-runtime";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-gray-500">{label}</p>;
}

export function ErpObservabilityPanels({ snapshot }: { snapshot: ErpObservabilitySnapshot }) {
  return (
    <>
      <section
        id="summary"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
      >
        <div>
          <div className="text-xs text-gray-500">Événements</div>
          <div className="font-semibold text-gray-900">{snapshot.summary.recentEventCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Handlers</div>
          <div className="font-semibold text-gray-900">{snapshot.summary.handlerCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Notifications</div>
          <div className="font-semibold text-gray-900">{snapshot.summary.notificationCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Automation</div>
          <div className="font-semibold text-gray-900">{snapshot.summary.automationCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Échecs</div>
          <div className="font-semibold text-red-700">{snapshot.summary.failureCount}</div>
        </div>
      </section>

      <p className="text-xs text-gray-500">
        Visibilité : {snapshot.visibility.roleClass} ({snapshot.visibility.mode})
        {snapshot.visibility.allowedPrefixes
          ? ` — préfixes : ${snapshot.visibility.allowedPrefixes.join(", ")}`
          : ""}
        {" · "}
        Catalogue {snapshot.bus.catalogVersion} ({snapshot.bus.officialEventCount} types)
      </p>

      <Section id="events" title="Événements récents (bus)">
        {snapshot.recentEvents.length === 0 ? (
          <Empty label="Aucun événement récent dans le ring buffer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-1 pr-3">Phase</th>
                  <th className="py-1 pr-3">Type</th>
                  <th className="py-1 pr-3">Consumer</th>
                  <th className="py-1">At</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshot.recentEvents].reverse().map((e) => (
                  <tr key={e.id} className="border-t border-gray-100">
                    <td className="py-1.5 pr-3 font-mono text-gray-700">{e.lifecyclePhase}</td>
                    <td className="py-1.5 pr-3 font-mono">{e.eventType}</td>
                    <td className="py-1.5 pr-3">{e.consumerKey ?? "—"}</td>
                    <td className="py-1.5 text-gray-500">{e.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section id="handlers" title="Handlers enregistrés">
        <p className="mb-2 text-xs text-gray-500">Bootstrap {snapshot.handlers.bootstrapVersion}</p>
        <ul className="space-y-1 text-xs font-mono text-gray-800">
          {snapshot.handlers.registrations.map((h) => (
            <li key={h.id}>
              {h.consumerKey} <span className="text-gray-400">({h.pattern})</span>
              {h.departmentScope ? ` · scope ${h.departmentScope}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="notifications" title="Notifications (bridge)">
        {snapshot.recentNotifications.length === 0 ? (
          <Empty label="Aucune projection notification récente." />
        ) : (
          <ul className="space-y-2 text-xs">
            {[...snapshot.recentNotifications].reverse().map((n) => (
              <li key={n.id} className="rounded border border-gray-100 p-2">
                <span className="font-mono text-gray-800">{n.candidate.templateKey}</span>
                <span className="text-gray-500"> · {n.consumerKey}</span>
                <div className="text-gray-600">{n.candidate.title}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="automation" title="Automation traces">
        {snapshot.recentAutomation.length === 0 ? (
          <Empty label="Aucune trace automation récente." />
        ) : (
          <ul className="space-y-2 text-xs">
            {[...snapshot.recentAutomation].reverse().map((a) => (
              <li key={a.id} className="rounded border border-gray-100 p-2 font-mono">
                {a.ruleKey} → {a.eventType} ({a.outcome})
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="failures" title="Échecs handlers">
        {snapshot.failures.length === 0 ? (
          <Empty label="Aucun handler_error récent." />
        ) : (
          <ul className="space-y-2 text-xs text-red-800">
            {[...snapshot.failures].reverse().map((f) => (
              <li key={f.id} className="rounded border border-red-100 bg-red-50 p-2">
                {f.eventType} — {f.consumerKey ?? "?"} — {f.detail ?? "error"}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
