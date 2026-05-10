import type { EmployeeHistoryEvent } from "@/modules/hr/employees/types";

export function EmployeeTimelinePanel({ history }: { history: EmployeeHistoryEvent[] }) {
  if (!history.length) return <p className="text-xs text-gray-500">Timeline vide.</p>;
  return (
    <ol className="space-y-2">
      {history.slice(0, 15).map((event) => (
        <li key={event.id} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
          {new Date(event.createdAt).toLocaleString("fr-FR")} · {event.eventLabel}
        </li>
      ))}
    </ol>
  );
}

