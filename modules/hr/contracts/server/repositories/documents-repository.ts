import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ContractDocument } from "@/modules/hr/contracts/types";

export async function listContractDocuments(contractId: string): Promise<ContractDocument[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_contract_documents")
    .select("id,contract_id,document_type,file_name,storage_path,created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: row.id,
    contractId: row.contract_id,
    documentType: row.document_type,
    fileName: row.file_name,
    storagePath: row.storage_path,
    createdAt: row.created_at,
  }));
}

