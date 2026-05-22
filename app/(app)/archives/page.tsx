import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { ArchivesGovernanceHub } from "@/components/archives/ArchivesGovernanceHub";

export const metadata: Metadata = {
  title: "Archives — gouvernance",
  description: "Centre historique ERP — consultation, traçabilité et conservation (lecture seule).",
};

export default async function ArchivesPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const superAdmin = await isSuperAdmin(data.user.id);
  if (!superAdmin) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Archives — gouvernance historique"
        subtitle="Centre de conservation, traçabilité et supervision (strictement lecture seule)."
      />
      <ArchivesGovernanceHub />
    </div>
  );
}
