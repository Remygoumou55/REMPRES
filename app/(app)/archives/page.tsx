import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";

const ArchivesPageClient = dynamic(() => import("./ArchivesPageClient").then((m) => m.ArchivesPageClient), {
  ssr: false,
});

export default async function ArchivesPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const superAdmin = await isSuperAdmin(data.user.id);
  if (!superAdmin) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader title="Archives" subtitle="Archives globales et par département" />
      <ArchivesPageClient />
    </div>
  );
}

