import type { EmployeeHistoryEvent } from "@/modules/hr/employees/types";

export function EmployeeHistoryPanel({ history }: { history: EmployeeHistoryEvent[] }) {
  if (!history.length) {
    return <p className="text-xs text-gray-500">Aucun historique.</p>;
  }
  return (
    <ul className="space-y-2">
      {history.slice(0, 20).map((event) => (
        <li key={event.id} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
          {event.eventType} · {event.eventLabel} · {new Date(event.createdAt).toLocaleString("fr-FR")}
        </li>
      ))}
    </ul>
  );
}

