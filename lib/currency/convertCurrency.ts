import type { SupabaseClient } from "@supabase/supabase-js";
import { convertCurrencyRpc } from "@/lib/currency/convertCurrencyRpc";
import { logError } from "@/lib/logger";

export type ConvertCurrencyArgs = {
  amount: number;
  from: string;
  to: string;
};

/**
 * Couche unique au-dessus du RPC `convert_currency` — à utiliser côté client ET serveur
 * (avec le Supabase client approprié). Ne pas appeler `convertCurrencyRpc` directement hors tests.
 */
export async function convertCurrency(
  supabase: SupabaseClient,
  args: ConvertCurrencyArgs,
  options?: { logPrefix?: string },
): Promise<number | null> {
  try {
    return await convertCurrencyRpc(supabase, args, {
      logPrefix: options?.logPrefix ?? "Currency conversion failed",
    });
  } catch (error) {
    logError("currency", options?.logPrefix ?? "Currency conversion failed", {
      amount: args.amount,
      from: args.from,
      to: args.to,
      error,
    });
    return null;
  }
}
