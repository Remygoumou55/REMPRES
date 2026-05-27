import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead, canLogistiqueWrite } from "@/lib/server/logistique-access";
import { listInventorySessions } from "@/lib/server/inventory";
import { InventaireSessionsClient } from "@/components/logistique/InventaireSessionsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Inventaire périodique" };

export default async function InventairePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const [sessions, canWrite] = await Promise.all([
    listInventorySessions(),
    canLogistiqueWrite(user.id),
  ]);

  return (
    <div className="page-wrapper">
      <InventaireSessionsClient
        sessions={sessions.data}
        canWrite={canWrite}
      />
    </div>
  );
}
