import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { RecruitmentDocument } from "@/modules/hr/recruitment/types";

export async function listCandidateDocuments(candidateId: string): Promise<RecruitmentDocument[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_documents")
    .select("id,candidate_id,document_type,file_name,storage_path,created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    documentType: row.document_type,
    fileName: row.file_name,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }));
}
