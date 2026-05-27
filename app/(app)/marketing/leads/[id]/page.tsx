import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Mail,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertMarketingRead,
  canMarketingDelete,
} from "@/lib/server/marketing-access";
import { getLeadById } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  LeadPipelineProgress,
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/marketing/marketing-badges";
import {
  LEAD_PIPELINE_ORDER,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/types/marketing";
import { ConvertLeadButton } from "@/components/marketing/ConvertLeadButton";
import {
  deleteLeadAction,
  updateLeadStatusAction,
} from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { success?: string; error?: string };
};

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function LeadDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingRead(user.id);

  const [lead, canDelete] = await Promise.all([
    getLeadById(params.id),
    canMarketingDelete(user.id),
  ]);
  if (!lead) notFound();

  const currentIdx = LEAD_PIPELINE_ORDER.indexOf(lead.status);
  const nextStatus: LeadStatus | null =
    lead.status === "lost" || lead.status === "converted"
      ? null
      : currentIdx >= 0 && currentIdx < LEAD_PIPELINE_ORDER.length - 1
        ? LEAD_PIPELINE_ORDER[currentIdx + 1]
        : null;

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`${lead.first_name} ${lead.last_name}`}
        subtitle={lead.company ?? "Particulier"}
        breadcrumbs={
          <Link
            href="/marketing/leads"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux leads
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LeadStatusBadge status={lead.status} />
            <Link
              href={`/marketing/leads/${lead.id}/edit`}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
            <ConvertLeadButton
              leadId={lead.id}
              leadName={`${lead.first_name} ${lead.last_name}`.trim()}
              leadEmail={lead.email}
              currentStatus={lead.status}
            />
            {canDelete ? (
              <form action={deleteLeadAction.bind(null, lead.id)}>
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

      <section className="card p-6">
        <LeadPipelineProgress status={lead.status} />
        <div className="mt-6 flex flex-wrap gap-2">
          {nextStatus ? (
            <form
              action={updateLeadStatusAction.bind(null, lead.id, nextStatus)}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                <ArrowRight className="h-4 w-4" />
                Avancer vers {LEAD_STATUS_LABELS[nextStatus]}
              </button>
            </form>
          ) : null}
          {lead.status !== "lost" && lead.status !== "converted" ? (
            <form action={updateLeadStatusAction.bind(null, lead.id, "lost")}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Marquer comme perdu
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="mt-6 card grid gap-4 p-6 md:grid-cols-2">
        <InfoField label="Prénom" value={lead.first_name} />
        <InfoField label="Nom" value={lead.last_name} />
        <InfoField
          label="Email"
          value={
            lead.email ? (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> {lead.email}
              </a>
            ) : (
              "—"
            )
          }
        />
        <InfoField
          label="Téléphone"
          value={
            lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> {lead.phone}
              </a>
            ) : (
              "—"
            )
          }
        />
        <InfoField label="Entreprise" value={lead.company ?? "—"} />
        <InfoField label="Source" value={<LeadSourceBadge source={lead.source} />} />
        <InfoField
          label="Campagne"
          value={
            lead.campaign ? (
              <Link
                href={`/marketing/campagnes/${lead.campaign_id}`}
                className="text-primary hover:underline"
              >
                {lead.campaign.title}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <InfoField
          label="Valeur estimée"
          value={formatGNF(Number(lead.estimated_value_gnf))}
        />
        <InfoField
          label="Notes"
          value={lead.notes ?? "—"}
          className="md:col-span-2"
        />
        <InfoField
          label="Créé le"
          value={new Date(lead.created_at).toLocaleString("fr-FR")}
        />
        <InfoField
          label="Dernière mise à jour"
          value={new Date(lead.updated_at).toLocaleString("fr-FR")}
        />
        {lead.converted_at ? (
          <InfoField
            label="Converti le"
            value={new Date(lead.converted_at).toLocaleString("fr-FR")}
            className="md:col-span-2"
          />
        ) : null}
        {lead.converted_client_id ? (
          <InfoField
            label="Client lié"
            value={
              <Link
                href={`/vente/clients/${lead.converted_client_id}`}
                className="text-primary hover:underline"
              >
                Voir le client converti →
              </Link>
            }
            className="md:col-span-2"
          />
        ) : null}
      </section>
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
