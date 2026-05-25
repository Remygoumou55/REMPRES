import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingWrite } from "@/lib/server/marketing-access";
import { getLeadById, listCampaignsForSelect } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { LeadForm } from "../../lead-form";
import { updateLeadAction } from "../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { error?: string };
};

export default async function EditLeadPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const [lead, campaigns] = await Promise.all([
    getLeadById(params.id),
    listCampaignsForSelect(),
  ]);
  if (!lead) notFound();

  const action = updateLeadAction.bind(null, params.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Modifier ${lead.first_name} ${lead.last_name}`}
        subtitle="Mise à jour du lead"
        breadcrumbs={
          <Link
            href={`/marketing/leads/${lead.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au lead
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <LeadForm
        action={action}
        initial={lead}
        campaigns={campaigns}
        submitLabel="Enregistrer les modifications"
        backHref={`/marketing/leads/${lead.id}`}
      />
    </div>
  );
}
