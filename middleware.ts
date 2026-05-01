import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";

// ---------------------------------------------------------------------------
// Routes protégées — authentification requise
// ---------------------------------------------------------------------------

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
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

// Routes accessibles uniquement au rôle admin canonique.
const ADMIN_ONLY_PREFIXES = ["/admin/users", "/admin/currency", "/admin/archives"];

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

const PROFILE_CACHE_COOKIE = "__rempres_profile_ok_ts";
const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;

function isAdminRoleKey(roleKey: string | null | undefined): boolean {
  const normalized = String(roleKey ?? "").trim().toLowerCase();
  return normalized === "super_admin" || normalized === "admin" || normalized === "directeur_general";
}

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

  // 1. Vérification authentification basée sur session cookie (léger).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

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
    const isAdminRoute = isAdminOnlyPath(pathname);
    const cachedProfileCheckedAt = Number(request.cookies.get(PROFILE_CACHE_COOKIE)?.value ?? "0");
    const profileCacheFresh =
      Number.isFinite(cachedProfileCheckedAt) &&
      cachedProfileCheckedAt > 0 &&
      Date.now() - cachedProfileCheckedAt < PROFILE_CACHE_TTL_MS;

    // On évite de relire "profiles" à chaque clic d'onglet.
    if (!profileCacheFresh || isAdminRoute) {
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

      // Routes admin-only — rôle admin canonique requis.
      if (isAdminRoute && !isAdminRoleKey(profile?.role_key)) {
        const deniedUrl = request.nextUrl.clone();
        deniedUrl.pathname = "/access-denied";
        return NextResponse.redirect(deniedUrl);
      }

      // Cache soft: réduit fortement la latence inter-onglets.
      response.cookies.set(PROFILE_CACHE_COOKIE, String(Date.now()), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: Math.floor(PROFILE_CACHE_TTL_MS / 1000),
      });
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
