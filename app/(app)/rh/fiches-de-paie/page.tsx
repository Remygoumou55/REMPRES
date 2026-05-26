import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhRead } from "@/lib/server/rh-access";
import { listPayslips } from "@/lib/server/payslips";
import { listEmployees } from "@/lib/server/rh";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { PayslipsListClient } from "@/components/rh/PayslipsListClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: { employeeId?: string; year?: string; success?: string; error?: string };
};

export default async function FichesDePayePage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhRead(user.id);

  const year = searchParams?.year ? Number(searchParams.year) : undefined;
  const employeeId = searchParams?.employeeId?.trim() || undefined;

  const [{ data: payslips, total }, { data: employees }] = await Promise.all([
    listPayslips({ employeeId, year, pageSize: 50 }),
    listEmployees({ limit: 200 }),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Fiches de paie"
        subtitle={`${total} bulletin(s) généré(s)`}
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      {payslips.length === 0 && !employeeId && !year ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune fiche de paie générée</p>
          <p className="text-xs text-gray-400">
            Générez des bulletins depuis la fiche d&apos;un collaborateur.
          </p>
        </section>
      ) : (
        <PayslipsListClient
          payslips={payslips}
          employees={employees}
          initialEmployeeId={employeeId ?? ""}
          initialYear={year ? String(year) : ""}
        />
      )}
    </div>
  );
}
