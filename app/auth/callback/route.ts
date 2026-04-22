/**
 * app/auth/callback/route.ts
 *
 * Point d'entrée pour TOUS les liens Supabase Auth :
 *   - Invitation d'un nouvel utilisateur
 *   - Récupération de mot de passe (reset)
 *   - Confirmation d'email
 *
 * Supabase redirige vers cette route avec ?code=XXX&type=invite|recovery|signup
 * On échange le code contre une session, puis on redirige selon le type.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "invite" | "recovery" | "signup"
  const next = searchParams.get("next") ?? "/dashboard";

  // Réponse de base (sera modifiée ci-dessous)
  const response = NextResponse.next();

  if (code) {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Invitation → définir le mot de passe
      if (type === "invite") {
        const redirectResponse = NextResponse.redirect(`${origin}/auth/set-password`);
        // Transférer les cookies de session vers la réponse de redirection
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }

      // Récupération de mot de passe → même page de définition
      if (type === "recovery") {
        const redirectResponse = NextResponse.redirect(`${origin}/auth/set-password?mode=recovery`);
        response.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }

      // Autre (confirmation email, etc.) → destination demandée
      const redirectResponse = NextResponse.redirect(`${origin}${next}`);
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  // En cas d'erreur ou code absent → login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
