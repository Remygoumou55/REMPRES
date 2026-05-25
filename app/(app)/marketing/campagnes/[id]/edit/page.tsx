import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingWrite } from "@/lib/server/marketing-access";
import { getCampaignById } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { CampaignForm } from "../../campaign-form";
import { updateCampaignAction } from "../../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { error?: string };
};

export default async function EditCampaignPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const campaign = await getCampaignById(params.id);
  if (!campaign) notFound();

  const action = updateCampaignAction.bind(null, params.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Modifier ${campaign.title}`}
        subtitle="Mise à jour de la campagne"
        breadcrumbs={
          <Link
            href={`/marketing/campagnes/${campaign.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la campagne
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <CampaignForm
        action={action}
        initial={campaign}
        submitLabel="Enregistrer les modifications"
        backHref={`/marketing/campagnes/${campaign.id}`}
      />
    </div>
  );
}
