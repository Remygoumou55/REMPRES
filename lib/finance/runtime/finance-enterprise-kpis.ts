/**
 * B3 — SoT KPI comptabilité / enterprise (lots journal, créances, paiements).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  getFinanceEnterpriseOverview,
  type FinanceEnterpriseOverview,
} from "@/modules/finance/server/services/finance-enterprise-overview";
import { assertFinanceRuntimeReadAccess } from "@/lib/finance/runtime/finance-runtime-security";

export const FINANCE_ENTERPRISE_KPI_SOURCE = "finance-enterprise-runtime-v1" as const;

export type FinanceEnterpriseKpis = FinanceEnterpriseOverview & {
  source: typeof FINANCE_ENTERPRISE_KPI_SOURCE;
};

export async function getFinanceEnterpriseKpis(
  supabase: SupabaseClient<Database>,
): Promise<FinanceEnterpriseKpis> {
  const overview = await getFinanceEnterpriseOverview(supabase);
  return {
    source: FINANCE_ENTERPRISE_KPI_SOURCE,
    ...overview,
  };
}

export async function getFinanceEnterpriseKpisGuarded(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FinanceEnterpriseKpis> {
  await assertFinanceRuntimeReadAccess(userId);
  return getFinanceEnterpriseKpis(supabase);
}
