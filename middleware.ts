import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { resolveNavRouteAlias, resolveNavRouteRewrite } from "@/lib/constants/nav-route-aliases";
import { isDeptRouteAllowed } from "@/lib/constants/role-routes";
import {
  edgeCanAccessPathForProfile,
  edgeHasAdminConsoleAccess,
  edgeResolveSettingsGovernanceRedirect,
} from "@/lib/middleware/edge-route-guards";
import { applyProfileHeaders } from "@/lib/middleware/profile-headers";

// ---------------------------------------------------------------------------
// Routes protégées — authentification requise
// ---------------------------------------------------------------------------

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/dept",
  "/settings",
  "/vente",
  "/admin",
  "/auth/set-password",
  "/rh",
  "/finance",
  "/formation",
  "/consultation",
  "/marketing",
  "/logistique",
  "/actions",
  "/archives",
  "/parametres",
  "/config",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminConsoleRestrictedPath(pathname: string): boolean {
  if (!(pathname === "/admin" || pathname.startsWith("/admin/"))) return false;
  if (
    pathname === "/admin/activity-logs" ||
    pathname.startsWith("/admin/activity-logs/")
  ) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Middleware principal
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const navRewrite = resolveNavRouteRewrite(pathname);
  if (navRewrite) {
    const target = request.nextUrl.clone();
    const [rewritePath, rewriteQuery] = navRewrite.split("?");
    target.pathname = rewritePath ?? navRewrite;
    target.search = rewriteQuery ? `?${rewriteQuery}` : "";
    return NextResponse.rewrite(target);
  }

  const navAlias = resolveNavRouteAlias(pathname);
  if (navAlias) {
    const target = request.nextUrl.clone();
    target.pathname = navAlias.split("?")[0] ?? navAlias;
    const query = navAlias.includes("?") ? navAlias.split("?")[1] : "";
    target.search = query ? `?${query}` : "";
    return NextResponse.redirect(target, 308);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && user) {
    const rootUrl = request.nextUrl.clone();
    rootUrl.pathname = "/";
    return NextResponse.redirect(rootUrl);
  }

  if (user && isProtectedPath(pathname)) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "role_key, is_active, department_key, department_id, first_name, last_name, email, preferred_language",
      )
      .eq("id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (profileError || !profile) {
      const errUrl = request.nextUrl.clone();
      errUrl.pathname = "/error-profile";
      return NextResponse.redirect(errUrl);
    }

    if (profile.is_active === false) {
      const blockedUrl = request.nextUrl.clone();
      blockedUrl.pathname = "/access-denied";
      blockedUrl.searchParams.set("reason", "blocked");
      return NextResponse.redirect(blockedUrl);
    }

    applyProfileHeaders(requestHeaders, {
      userId: user.id,
      roleKey: profile.role_key ?? null,
      departmentKey: profile.department_key ?? null,
      departmentId: profile.department_id ?? null,
      isActive: profile.is_active !== false,
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
      email: profile.email ?? user.email ?? null,
      preferredLanguage: profile.preferred_language ?? null,
    });
    response = NextResponse.next({ request: { headers: requestHeaders } });

    const governanceRedirect = edgeResolveSettingsGovernanceRedirect(pathname);
    if (governanceRedirect) {
      const target = request.nextUrl.clone();
      target.pathname = governanceRedirect;
      target.search = "";
      return NextResponse.redirect(target, 308);
    }

    const roleKey = profile.role_key ?? null;
    const deptKey = profile.department_key ?? null;

    if (
      isAdminConsoleRestrictedPath(pathname) &&
      !edgeHasAdminConsoleAccess(roleKey, deptKey)
    ) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/access-denied";
      return NextResponse.redirect(deniedUrl);
    }

    if (!edgeCanAccessPathForProfile(pathname, roleKey, deptKey)) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/access-denied";
      return NextResponse.redirect(deniedUrl);
    }

    const normalizedRole = String(roleKey ?? request.cookies.get("rempres_role")?.value ?? "")
      .trim()
      .toLowerCase();

    if (
      normalizedRole &&
      normalizedRole !== "super_admin" &&
      normalizedRole !== "directeur_general" &&
      !isDeptRouteAllowed(normalizedRole, pathname)
    ) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = "/access-denied";
      return NextResponse.redirect(deniedUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/dept",
    "/dept/:path*",
    "/settings",
    "/settings/:path*",
    "/vente",
    "/vente/:path*",
    "/admin",
    "/admin/:path*",
    "/auth/set-password",
    "/rh",
    "/rh/:path*",
    "/finance",
    "/finance/:path*",
    "/formation",
    "/formation/:path*",
    "/consultation",
    "/consultation/:path*",
    "/marketing",
    "/marketing/:path*",
    "/logistique",
    "/logistique/:path*",
    "/actions",
    "/actions/:path*",
    "/archives",
    "/archives/:path*",
    "/config",
    "/config/:path*",
    "/parametres",
    "/parametres/:path*",
    "/login",
  ],
};
