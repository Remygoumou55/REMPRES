import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Edit, FileText, Receipt, Trash2 } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhRead, canRhDelete, canRhManageLeaves } from "@/lib/server/rh-access";
import {
  buildEmployeeContractData,
  getAttendanceMonthlyStats,
  getEmployeeById,
  listAttendance,
  listLeaveRequests,
} from "@/lib/server/rh";
import { canGenerateEmploymentContract } from "@/lib/server/rh-access";
import ContratButton from "@/components/rh/ContratButton";
import { listPayslips } from "@/lib/server/payslips";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  AttendanceStatusBadge,
  ContractTypeBadge,
  EmployeeAvatar,
  EmployeeStatusBadge,
  LeaveStatusBadge,
  LeaveTypeBadge,
} from "@/components/rh/rh-badges";
import { PayslipGeneratorForm } from "@/components/rh/PayslipGeneratorForm";
import { EmployeePayslipsTab } from "@/components/rh/EmployeePayslipsTab";
import { deleteEmployeeAction } from "../actions";
import {
  approveLeaveAction,
  rejectLeaveAction,
} from "../../conges/actions";
import { generatePayslipAction } from "../../fiches-de-paie/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { tab?: string; success?: string; error?: string };
};

const VALID_TABS = new Set(["profil", "conges", "presences", "fiches-de-paie"]);

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function durationDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.floor((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export default async function CollaborateurDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhRead(user.id);

  const [employee, [canDelete, canManageLeaves], canGenerateContract] = await Promise.all([
    getEmployeeById(params.id),
    Promise.all([canRhDelete(user.id), canRhManageLeaves(user.id)]),
    canGenerateEmploymentContract(user.id),
  ]);
  if (!employee) notFound();

  const contractData = canGenerateContract ? buildEmployeeContractData(employee) : null;

  const tab = VALID_TABS.has(searchParams?.tab ?? "") ? searchParams!.tab! : "profil";

  const [{ data: leaves }, { data: attendance }, monthlyStats, { data: payslips }] = await Promise.all([
    tab === "conges" || tab === "profil"
      ? listLeaveRequests({ employeeId: employee.id, pageSize: 25 })
      : Promise.resolve({ data: [], total: 0 }),
    tab === "presences" || tab === "profil"
      ? listAttendance({ employeeId: employee.id, pageSize: 30 })
      : Promise.resolve({ data: [], total: 0 }),
    getAttendanceMonthlyStats(employee.id),
    tab === "fiches-de-paie"
      ? listPayslips({ employeeId: employee.id, pageSize: 50 })
      : Promise.resolve({ data: [], total: 0 }),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        subtitle={`${employee.position} · ${employee.department}`}
        breadcrumbs={
          <Link
            href="/rh/collaborateurs"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux collaborateurs
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EmployeeStatusBadge isActive={employee.is_active} />
            <Link
              href={`/rh/collaborateurs/${employee.id}/edit`}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
            {contractData && canGenerateContract ? (
              <ContratButton data={contractData} />
            ) : null}
            {canDelete ? (
              <form action={deleteEmployeeAction.bind(null, employee.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </form>
            ) : null}
          </div>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <EmployeeAvatar firstName={employee.first_name} lastName={employee.last_name} size={56} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <ContractTypeBadge type={employee.contract_type} />
            <span>·</span>
            <span>Embauché le {employee.hire_date}</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {employee.email ?? "—"}{employee.phone ? ` · ${employee.phone}` : ""}
          </div>
        </div>
      </div>

      <nav className="mb-6 flex flex-wrap border-b border-gray-200">
        {[
          { id: "profil", label: "Profil", icon: FileText },
          { id: "conges", label: "Congés", icon: Calendar },
          { id: "presences", label: "Présences", icon: Clock },
          { id: "fiches-de-paie", label: "Fiches de paie", icon: Receipt },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={`/rh/collaborateurs/${employee.id}?tab=${t.id}`}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-darktext"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </nav>

      {tab === "profil" ? (
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <InfoField label="Prénom" value={employee.first_name} />
          <InfoField label="Nom" value={employee.last_name} />
          <InfoField label="Email" value={employee.email ?? "—"} />
          <InfoField label="Téléphone" value={employee.phone ?? "—"} />
          <InfoField label="Adresse" value={employee.address ?? "—"} className="md:col-span-2" />
          <InfoField label="Poste" value={employee.position} />
          <InfoField label="Département" value={employee.department} />
          <InfoField
            label="Type de contrat"
            value={<ContractTypeBadge type={employee.contract_type} />}
          />
          <InfoField label="Date d'embauche" value={employee.hire_date} />
          <InfoField
            label="Salaire mensuel"
            value={formatGNF(Number(employee.salary_gnf))}
          />
          <InfoField
            label="Statut"
            value={<EmployeeStatusBadge isActive={employee.is_active} />}
          />
        </section>
      ) : null}

      {tab === "conges" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-darktext">Demandes de congé</h2>
            <Link
              href={`/rh/conges/new?employeeId=${employee.id}`}
              className="btn-primary text-sm"
            >
              Nouvelle demande de congé
            </Link>
          </div>

          {leaves.length === 0 ? (
            <p className="card p-6 text-sm text-gray-500">
              Aucune demande de congé enregistrée.
            </p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-3">Type</th>
                    <th className="p-3">Du</th>
                    <th className="p-3">Au</th>
                    <th className="p-3">Durée</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Motif</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="p-3">
                        <LeaveTypeBadge type={l.leave_type} />
                      </td>
                      <td className="p-3">{l.start_date}</td>
                      <td className="p-3">{l.end_date}</td>
                      <td className="p-3">{durationDays(l.start_date, l.end_date)} j</td>
                      <td className="p-3">
                        <LeaveStatusBadge status={l.status} />
                      </td>
                      <td className="p-3 max-w-xs truncate" title={l.reason ?? ""}>
                        {l.reason ?? "—"}
                      </td>
                      <td className="p-3">
                        {canManageLeaves && l.status === "pending" ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <form action={approveLeaveAction.bind(null, l.id)}>
                              <button
                                type="submit"
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Approuver
                              </button>
                            </form>
                            <form action={rejectLeaveAction.bind(null, l.id)}>
                              <button
                                type="submit"
                                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                Rejeter
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "fiches-de-paie" ? (
        <section className="space-y-6">
          <PayslipGeneratorForm
            employee={{
              id: employee.id,
              first_name: employee.first_name,
              last_name: employee.last_name,
              position: employee.position,
              department: employee.department,
              contract_type: employee.contract_type,
              hire_date: employee.hire_date,
              salary_gnf: Number(employee.salary_gnf ?? 0),
            }}
            onSave={async (input) => {
              "use server";
              return generatePayslipAction(input);
            }}
          />
          <EmployeePayslipsTab
            payslips={payslips}
            employee={employee}
          />
        </section>
      ) : null}

      {tab === "presences" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-darktext">Présences ce mois</h2>
            <Link
              href={`/rh/presences/new?employeeId=${employee.id}`}
              className="btn-primary text-sm"
            >
              Enregistrer une présence
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <StatPill label="Présent" value={monthlyStats.present} tone="emerald" />
            <StatPill label="Absent" value={monthlyStats.absent} tone="red" />
            <StatPill label="En retard" value={monthlyStats.late} tone="amber" />
            <StatPill label="Demi-journée" value={monthlyStats.halfDay} tone="blue" />
          </div>

          {attendance.length === 0 ? (
            <p className="card p-6 text-sm text-gray-500">
              Aucune présence enregistrée pour ce collaborateur.
            </p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-3">Date</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Arrivée</th>
                    <th className="p-3">Départ</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((a) => (
                    <tr key={a.id} className="border-b border-gray-100">
                      <td className="p-3">{a.date}</td>
                      <td className="p-3">
                        <AttendanceStatusBadge status={a.status} />
                      </td>
                      <td className="p-3">{a.arrival_time ?? "—"}</td>
                      <td className="p-3">{a.departure_time ?? "—"}</td>
                      <td className="p-3 max-w-xs truncate" title={a.notes ?? ""}>
                        {a.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-darktext">{value}</div>
    </div>
  );
}

function StatPill({
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
    <div className={`rounded-xl border p-3 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
