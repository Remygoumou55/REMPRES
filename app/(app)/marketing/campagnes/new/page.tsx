import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertMarketingWrite } from "@/lib/server/marketing-access";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { CampaignForm } from "../campaign-form";
import { createCampaignAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { error?: string } };

export default async function NewCampaignPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Nouvelle campagne"
        subtitle="Lancer une campagne marketing"
        breadcrumbs={
          <Link
            href="/marketing/campagnes"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux campagnes
          </Link>
        }
      />
      <FlashMessage error={searchParams?.error} />
      <CampaignForm action={createCampaignAction} submitLabel="Créer la campagne" />
    </div>
  );
}
