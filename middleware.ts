import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Routes protégées — authentification requise
// ---------------------------------------------------------------------------

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/vente",
  "/admin",
  "/auth/set-password",
  // Modules métier (construits ou en cours de développement)
  "/rh",
  "/finance",
  "/formation",
  "/consultation",
  "/marketing",
  "/logistique",
];

// Routes accessibles uniquement au rôle super_admin
const ADMIN_ONLY_PREFIXES = ["/admin/users"];

// Routes publiques (pas de redirection si connecté, sauf /login)
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/error",
  "/coming-soon",
  "/error-profile",
  "/access-denied",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// ---------------------------------------------------------------------------
// Middleware principal
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) return response;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // 1. Vérification de l'authentification (JWT revalidé côté serveur)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Non connecté → accès à une route protégée : rediriger vers /login ──
  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Connecté → tente d'accéder à /login : rediriger vers /dashboard ────
  if (pathname === "/login" && user) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashUrl);
  }

  // ── Vérifications profil (is_active + role_key) — une seule requête DB ──
  if (user && isProtectedPath(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role_key, is_active")
      .eq("id", user.id)
      .single();

    // Compte bloqué → accès refusé
    if (profile && profile.is_active === false) {
      const blockedUrl = request.nextUrl.clone();
      blockedUrl.pathname = "/access-denied";
      blockedUrl.searchParams.set("reason", "blocked");
      return NextResponse.redirect(blockedUrl);
    }

    // /admin/users — super_admin uniquement
    if (isAdminOnlyPath(pathname) && profile?.role_key !== "super_admin") {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/access-denied";
      return NextResponse.redirect(deniedUrl);
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher — liste exhaustive de toutes les routes gérées
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    // Routes construites
    "/dashboard/:path*",
    "/vente/:path*",
    "/admin/:path*",
    "/auth/set-password",
    // Modules métier (construits ou en cours)
    "/rh/:path*",
    "/finance",
    "/finance/:path*",
    "/formation/:path*",
    "/consultation/:path*",
    "/marketing/:path*",
    "/logistique/:path*",
    // Pages d'auth (pour rediriger les utilisateurs déjà connectés)
    "/login",
  ],
};
