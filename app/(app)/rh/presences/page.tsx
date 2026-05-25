import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardClock, Clock, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhRead } from "@/lib/server/rh-access";
import { listAttendance } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { AttendanceStatusBadge } from "@/components/rh/rh-badges";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { date?: string; success?: string; error?: string };
};

function durationHours(arrival: string | null, departure: string | null): string {
  if (!arrival || !departure) return "—";
  const [ah, am] = arrival.split(":").map(Number);
  const [dh, dm] = departure.split(":").map(Number);
  const minutes = dh * 60 + dm - (ah * 60 + am);
  if (Number.isNaN(minutes) || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default async function PresencesPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhRead(user.id);

  const today = new Date().toISOString().slice(0, 10);
  const date = (searchParams?.date ?? today).slice(0, 10);

  const { data } = await listAttendance({
    dateFrom: date,
    dateTo: date,
    pageSize: 200,
  });

  const present = data.filter((a) => a.status === "present").length;
  const absent = data.filter((a) => a.status === "absent").length;
  const late = data.filter((a) => a.status === "late").length;
  const halfDay = data.filter((a) => a.status === "half_day").length;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Présences"
        subtitle={`Suivi journalier · ${date}`}
        actions={
          <Link
            href={`/rh/presences/new?date=${date}`}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Enregistrer présence
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Présents aujourd'hui" value={present} tone="emerald" />
        <SummaryCard label="Absents" value={absent} tone="red" />
        <SummaryCard label="En retard" value={late} tone="amber" />
        <SummaryCard label="Demi-journée" value={halfDay} tone="blue" />
      </div>

      <form method="get" className="my-6 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Date</label>
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="input max-w-[180px]"
        />
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
        {date !== today ? (
          <Link
            href="/rh/presences"
            className="text-xs font-medium text-primary hover:underline"
          >
            Revenir à aujourd&apos;hui
          </Link>
        ) : null}
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <ClipboardClock className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune présence enregistrée pour cette date</p>
          <p className="text-xs">
            Cliquez sur « Enregistrer présence » pour démarrer le pointage.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Collaborateur</th>
                <th className="p-3">Date</th>
                <th className="p-3">Arrivée</th>
                <th className="p-3">Départ</th>
                <th className="p-3">Durée</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => {
                const emp = a.employee;
                const empName = emp
                  ? `${emp.first_name} ${emp.last_name}`
                  : a.employee_id.slice(0, 8);
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <Link
                        href={`/rh/collaborateurs/${a.employee_id}?tab=presences`}
                        className="font-medium text-primary hover:underline"
                      >
                        {empName}
                      </Link>
                      {emp?.department ? (
                        <div className="text-xs text-gray-500">{emp.department}</div>
                      ) : null}
                    </td>
                    <td className="p-3">{a.date}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {a.arrival_time ?? "—"}
                      </span>
                    </td>
                    <td className="p-3">{a.departure_time ?? "—"}</td>
                    <td className="p-3">{durationHours(a.arrival_time, a.departure_time)}</td>
                    <td className="p-3">
                      <AttendanceStatusBadge status={a.status} />
                    </td>
                    <td className="p-3 max-w-xs truncate" title={a.notes ?? ""}>
                      {a.notes ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "red" | "amber" | "blue";
}) {
  const tones: Record<string, string> = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
