import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type CrmQuoteWithClient = Database["public"]["Tables"]["crm_quotes"]["Row"] & {
  clients: Pick<
    Database["public"]["Tables"]["clients"]["Row"],
    "company_name" | "first_name" | "last_name" | "client_type"
  > | null;
};

export async function listCrmQuotesWithClients(
  supabase: SupabaseClient<Database>,
  limit = 150,
): Promise<CrmQuoteWithClient[]> {
  const { data, error } = await supabase
    .from("crm_quotes")
    .select(
      "id,quote_number,client_id,opportunity_id,status,valid_until,currency,total_amount_gnf,sale_id,created_at,clients(company_name,first_name,last_name,client_type)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmQuoteWithClient[];
}
