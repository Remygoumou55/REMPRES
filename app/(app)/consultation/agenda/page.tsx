import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertConsultationRead } from "@/lib/server/consultation-access";
import { listAppointments } from "@/lib/server/consultation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { softDeleteAppointmentAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { period?: "today" | "week" | "all"; success?: string; error?: string };
};

const PERIOD_LABELS = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  all: "Tous",
};

export default async function AgendaPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationRead(user.id);

  const period = searchParams?.period ?? "week";
  const { data, total } = await listAppointments({ period });

  const byDate = new Map<string, typeof data>();
  data.forEach((a) => {
    const key = a.appointment_date;
    const list = byDate.get(key) ?? [];
    list.push(a);
    byDate.set(key, list);
  });
  const sortedDates = Array.from(byDate.keys()).sort();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Agenda"
        subtitle={`${total} rendez-vous — ${PERIOD_LABELS[period]}`}
        actions={
          <Link href="/consultation/agenda/new" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Nouveau rendez-vous
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="mb-6 flex gap-2">
        {(["today", "week", "all"] as const).map((p) => (
          <Link
            key={p}
            href={`/consultation/agenda?period=${p}`}
            className={`rounded-lg px-3 py-1.5 text-sm ${period === p ? "bg-primary text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {PERIOD_LABELS[p]}
          </Link>
        ))}
      </div>

      {sortedDates.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Calendar className="h-12 w-12 text-gray-300" />
          <p>Aucun rendez-vous</p>
        </section>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <section key={date}>
              <h2 className="mb-3 text-lg font-semibold text-darktext">
                {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="p-3">Heure</th>
                      <th className="p-3">Titre</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(byDate.get(date) ?? []).map((a) => (
                      <tr key={a.id} className="border-b border-gray-100">
                        <td className="p-3">
                          {a.start_time ? String(a.start_time).slice(0, 5) : "—"}
                          {a.end_time ? ` – ${String(a.end_time).slice(0, 5)}` : ""}
                        </td>
                        <td className="p-3 font-medium">{a.title}</td>
                        <td className="p-3">{a.client_name ?? "—"}</td>
                        <td className="p-3">{a.status}</td>
                        <td className="p-3">
                          <form action={softDeleteAppointmentAction.bind(null, a.id)}>
                            <button type="submit" className="text-xs text-red-600">
                              Supprimer
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
