import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { ArchiveDeptView } from "@/components/archives/archive-dept-view";
import {
  ARCHIVE_DEPT_KEYS,
  ARCHIVE_DEPT_LABELS,
  assertArchivesAccess,
  getArchiveData,
  type ArchiveDeptKey,
} from "@/lib/server/archives";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    deptKey: string;
  };
};

function parseDeptKey(raw: string): ArchiveDeptKey | null {
  const key = raw.trim().toLowerCase();
  return (ARCHIVE_DEPT_KEYS as readonly string[]).includes(key) ? (key as ArchiveDeptKey) : null;
}

export async function generateMetadata({ params }: PageProps) {
  const dept = parseDeptKey(params.deptKey);
  const label = dept ? ARCHIVE_DEPT_LABELS[dept] : "Archives";
  return {
    title: `Archives — ${label}`,
    description: `Archives du département ${label}.`,
  };
}

export default async function ArchiveDeptPage({ params }: PageProps) {
  const dept = parseDeptKey(params.deptKey);
  if (!dept) redirect("/archives/globales");

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertArchivesAccess(user.id);

  const archiveData = await getArchiveData(dept);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={`Archives — ${ARCHIVE_DEPT_LABELS[dept]}`}
        subtitle="Lecture seule · traçabilité et conservation"
      />
      <ArchiveDeptView data={archiveData} />
    </div>
  );
}
