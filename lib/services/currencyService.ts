"use client";

import { convertCurrency as convertCurrencyThroughSupabase } from "@/lib/currency/convertCurrency";
import type { ConvertCurrencyArgs } from "@/lib/currency/convertCurrency";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { logError } from "@/lib/logger";

/**
 * Point d’entrée client : même pile que le serveur (`lib/server/currencyService.convert`),
 * via `@/lib/currency/convertCurrency`.
 */
export async function convertCurrency(args: ConvertCurrencyArgs): Promise<number | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    return await convertCurrencyThroughSupabase(supabase, args, {
      logPrefix: "Currency conversion failed (client)",
    });
  } catch (error) {
    logError("currency", "Currency conversion failed (client bootstrap)", {
      amount: args.amount,
      from: args.from,
      to: args.to,
      error,
    });
    return null;
  }
}
