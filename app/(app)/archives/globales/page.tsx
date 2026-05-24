import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { ArchiveGlobalesView } from "@/components/archives/archive-globales-view";
import { assertArchivesAccess, getArchiveGlobalesSummary } from "@/lib/server/archives";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Archives — Globales",
  description: "Vue d'ensemble des éléments archivés par département.",
};

export default async function ArchivesGlobalesPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertArchivesAccess(user.id);

  const cards = await getArchiveGlobalesSummary();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Archives — Globales"
        subtitle="Lecture seule · traçabilité et conservation"
      />
      <ArchiveGlobalesView cards={cards} />
    </div>
  );
}
