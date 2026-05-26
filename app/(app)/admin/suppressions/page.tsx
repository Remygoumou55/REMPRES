import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isSuperAdmin } from "@/lib/server/permissions";
import { getAllDeletedRecords } from "@/lib/server/suppressions";
import { PageHeader } from "@/components/ui/page-header";
import { SuppressionsSection } from "@/components/admin/SuppressionsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Corbeille — Admin",
};

export default async function AdminSuppressionsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  if (!(await isSuperAdmin(user.id))) {
    redirect("/dashboard");
  }

  const data = await getAllDeletedRecords();
  const isEmpty = data.total === 0;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Corbeille"
        subtitle="Éléments supprimés — restauration possible"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total supprimé" value={data.total} tone="gray" />
        <SummaryCard label="Clients" value={data.clients.length} tone="blue" />
        <SummaryCard label="Produits" value={data.products.length} tone="amber" />
        <SummaryCard
          label="Employés"
          value={data.employees.length}
          tone="purple"
        />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle size={48} className="mb-4 text-green-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            La corbeille est vide
          </h3>
          <p className="text-sm text-gray-500">
            Aucun élément supprimé pour le moment.
          </p>
        </div>
      ) : (
        <div>
          <SuppressionsSection
            records={data.clients}
            sectionTitle="Clients supprimés"
            module="vente"
            table="clients"
          />
          <SuppressionsSection
            records={data.products}
            sectionTitle="Produits supprimés"
            module="vente"
            table="products"
          />
          <SuppressionsSection
            records={data.employees}
            sectionTitle="Employés supprimés"
            module="rh"
            table="employees"
          />
          <SuppressionsSection
            records={data.trainings}
            sectionTitle="Formations supprimées"
            module="formation"
            table="trainings"
          />
          <SuppressionsSection
            records={data.missions}
            sectionTitle="Missions supprimées"
            module="consultation"
            table="missions"
          />
          <SuppressionsSection
            records={data.campaigns}
            sectionTitle="Campagnes supprimées"
            module="marketing"
            table="campaigns"
          />
          <SuppressionsSection
            records={data.leads}
            sectionTitle="Leads supprimés"
            module="marketing"
            table="leads"
          />
        </div>
      )}
    </div>
  );
}

type SummaryTone = "gray" | "blue" | "amber" | "purple";

const SUMMARY_TONES: Record<SummaryTone, { bg: string; text: string }> = {
  gray: { bg: "bg-gray-50", text: "text-gray-900" },
  blue: { bg: "bg-blue-50", text: "text-blue-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-700" },
  purple: { bg: "bg-purple-50", text: "text-purple-700" },
};

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: SummaryTone;
}) {
  const t = SUMMARY_TONES[tone];
  return (
    <div className={`rounded-xl ${t.bg} p-4 text-center`}>
      <div className={`text-2xl font-medium ${t.text}`}>{value}</div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}
