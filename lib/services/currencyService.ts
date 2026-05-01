"use client";

import { convertCurrencyRpc } from "@/lib/currency/convertCurrencyRpc";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { logError } from "@/lib/logger";

type ConvertCurrencyArgs = {
  amount: number;
  from: string;
  to: string;
};

/** Point d’entrée unique côté client pour les conversions métier (RPC). */
export async function convertCurrency(args: ConvertCurrencyArgs): Promise<number | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    return await convertCurrencyRpc(supabase, args, {
      logPrefix: "Currency conversion failed (client)",
    });
  } catch (error) {
    logError("currency", "Currency conversion failed (client)", {
      amount: args.amount,
      from: args.from,
      to: args.to,
      error,
    });
    return null;
  }
}
