import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead, canLogistiqueWrite } from "@/lib/server/logistique-access";
import {
  getInventoryLines,
  getInventorySession,
} from "@/lib/server/inventory";
import { PageHeader } from "@/components/ui/page-header";
import { InventaireCountingClient } from "@/components/logistique/InventaireCountingClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: { id: string } };

export default async function InventaireDetailPage({ params }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const session = await getInventorySession(params.id);
  if (!session) notFound();

  const [lines, canWrite] = await Promise.all([
    getInventoryLines(params.id),
    canLogistiqueWrite(user.id),
  ]);

  if (session.status === "draft") {
    redirect("/logistique/inventaire");
  }

  return (
    <div className="page-wrapper space-y-4">
      <Link
        href="/logistique/inventaire"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux inventaires
      </Link>

      <PageHeader title={session.name} subtitle="Saisie des comptages physiques" />

      <InventaireCountingClient
        session={session}
        lines={lines}
        canWrite={canWrite}
      />
    </div>
  );
}
