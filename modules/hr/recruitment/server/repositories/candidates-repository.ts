import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";
import type { PipelineStage } from "@/modules/hr/recruitment/constants";

function mapCandidate(row: {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  job_title: string;
  department_key: string | null;
  pipeline_stage: string;
  source_channel: string;
  notes: string | null;
  hire_approval_request_id: string | null;
  hired_profile_id: string | null;
  hired_contract_id: string | null;
  created_at: string;
  updated_at: string;
}): RecruitmentCandidate {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    jobTitle: row.job_title,
    departmentKey: row.department_key,
    pipelineStage: row.pipeline_stage as PipelineStage,
    sourceChannel: row.source_channel,
    notes: row.notes,
    hireApprovalRequestId: row.hire_approval_request_id,
    hiredProfileId: row.hired_profile_id,
    hiredContractId: row.hired_contract_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCandidates(limit = 400): Promise<RecruitmentCandidate[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_candidates")
    .select(
      "id,full_name,email,phone,job_title,department_key,pipeline_stage,source_channel,notes,hire_approval_request_id,hired_profile_id,hired_contract_id,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapCandidate);
}

export async function getCandidateById(candidateId: string): Promise<RecruitmentCandidate | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_candidates")
    .select(
      "id,full_name,email,phone,job_title,department_key,pipeline_stage,source_channel,notes,hire_approval_request_id,hired_profile_id,hired_contract_id,created_at,updated_at",
    )
    .eq("id", candidateId)
    .maybeSingle();
  if (!data) return null;
  return mapCandidate(data);
}
