import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { Database } from "@/types/database.types";

/** Options passed to Set-Cookie (name/value set separately by Supabase helpers). */
type CookieSetOptions = Partial<Omit<ResponseCookie, "name" | "value">>;

export function getSupabaseServerClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieSetOptions) {
        try {
          cookieStore.set({ name, value, ...(options ?? {}) });
        } catch {
          // ignore (Next.js edge/runtime limitation)
        }
      },
      remove(name: string, options?: CookieSetOptions) {
        try {
          cookieStore.set({ name, value: "", ...(options ?? {}) });
        } catch {
          // ignore
        }
      },
    },
  });
}