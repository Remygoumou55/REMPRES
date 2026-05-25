import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingWrite } from "@/lib/server/marketing-access";
import { listCampaignsForSelect } from "@/lib/server/marketing";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { LeadForm } from "../lead-form";
import { createLeadAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string; campaignId?: string } };

export default async function NewLeadPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const campaigns = await listCampaignsForSelect();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Ajouter un lead"
        subtitle="Enregistrer un nouveau prospect"
        breadcrumbs={
          <Link
            href="/marketing/leads"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux leads
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <LeadForm
        action={createLeadAction}
        campaigns={campaigns}
        defaultCampaignId={searchParams?.campaignId}
        submitLabel="Créer le lead"
      />
    </div>
  );
}
