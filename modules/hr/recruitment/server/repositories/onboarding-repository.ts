import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { RecruitmentOnboarding } from "@/modules/hr/recruitment/types";
import type { Database, Json } from "@/types/database.types";

export async function getOnboardingByCandidateId(candidateId: string): Promise<RecruitmentOnboarding | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_onboarding")
    .select("id,candidate_id,status,checklist,linked_profile_id,linked_contract_id,updated_at")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (!data) return null;
  const checklist = data.checklist && typeof data.checklist === "object" && !Array.isArray(data.checklist)
    ? (data.checklist as Record<string, unknown>)
    : {};
  return {
    id: data.id,
    candidateId: data.candidate_id,
    status: data.status,
    checklist,
    linkedProfileId: data.linked_profile_id,
    linkedContractId: data.linked_contract_id,
    updatedAt: data.updated_at,
  };
}

export async function upsertOnboardingPatch(
  candidateId: string,
  patch: {
    status?: "not_started" | "in_progress" | "completed";
    checklist?: Record<string, unknown>;
    linked_profile_id?: string | null;
    linked_contract_id?: string | null;
  },
): Promise<void> {
  const supabase = getSupabaseServerClient();
  const existing = await supabase.from("rh_recruitment_onboarding").select("id").eq("candidate_id", candidateId).maybeSingle();
  if (existing.data?.id) {
    const updatePayload: Database["public"]["Tables"]["rh_recruitment_onboarding"]["Update"] = {};
    if (patch.status !== undefined) updatePayload.status = patch.status;
    if (patch.checklist !== undefined) updatePayload.checklist = patch.checklist as Json;
    if (patch.linked_profile_id !== undefined) updatePayload.linked_profile_id = patch.linked_profile_id;
    if (patch.linked_contract_id !== undefined) updatePayload.linked_contract_id = patch.linked_contract_id;
    if (Object.keys(updatePayload).length === 0) return;
    await supabase.from("rh_recruitment_onboarding").update(updatePayload).eq("candidate_id", candidateId);
    return;
  }
  await supabase.from("rh_recruitment_onboarding").insert({
    candidate_id: candidateId,
    status: patch.status ?? "not_started",
    checklist: (patch.checklist ?? {}) as Json,
    linked_profile_id: patch.linked_profile_id ?? null,
    linked_contract_id: patch.linked_contract_id ?? null,
  });
}
