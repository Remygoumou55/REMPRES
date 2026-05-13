import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { listFinanceJournalBatchesByStatus } from "@/modules/finance/server/repositories/finance-journal-repository";
import { FinanceJournalTable } from "@/modules/finance/components/journal/FinanceJournalTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

export default async function FinanceEnterpriseAuditPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const superAdmin = await isSuperAdmin(user.id);
  const supabase = getSupabaseServerClient();
  const posted = await listFinanceJournalBatchesByStatus(supabase, "posted", 60);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Audit finance"
        subtitle="Piste opérationnelle (lots comptabilisés) + lien vers l’audit gouvernance complet."
      />

      <SectionPanel
        title="Journal — lots postés récents"
        description="Historique métier visible pour tout utilisateur avec lecture finance."
      >
        <FinanceJournalTable rows={posted} />
      </SectionPanel>

      <SectionPanel title="Audit gouvernance (immutable)">
        {superAdmin ? (
          <Link
            href="/admin/audit?department=finance"
            className="inline-flex rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Ouvrir governance_audit_events (filtre finance)
          </Link>
        ) : (
          <p className="text-sm text-gray-600">
            Le registre d’audit immutable est réservé aux super administrateurs. La liste ci-dessus couvre la traçabilité
            des validations comptables opérationnelles.
          </p>
        )}
      </SectionPanel>
    </div>
  );
}
