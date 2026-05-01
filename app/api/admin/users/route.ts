import { NextResponse } from "next/server";

/** Session (cookies) via getSupabaseServerClient — pas de cache statique. */
export const dynamic = "force-dynamic";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminConfigErrorMessage } from "@/lib/supabaseAdmin";
import { isAdminRole } from "@/lib/server/permissions";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";
import { listUsers } from "@/lib/server/users";
import { logError } from "@/lib/logger";

/**
 * Liste JSON des utilisateurs (admin) — pour rafraîchissement sans rechargement SPA.
 */
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const isAdmin = await isAdminRole(data.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const listResult = await listUsers(data.user.id);
    if (!listResult.success) {
      if (listResult.error === USERS_LIST_CONFIG_ERROR_CODE) {
        const cfg = getSupabaseAdminConfigErrorMessage();
        logError("API_ADMIN_USERS_GET", cfg ? new Error(cfg) : new Error("config"), {
          route: "/api/admin/users",
        });
        return NextResponse.json(
          {
            error:
              "Configuration serveur Supabase incomplète (clé service requise côté serveur). Contactez un administrateur.",
            code: USERS_LIST_CONFIG_ERROR_CODE,
          },
          { status: 503 },
        );
      }
      if (listResult.error === "Accès refusé.") {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      }
      logError("API_ADMIN_USERS_GET", new Error(listResult.error), { route: "/api/admin/users" });
      return NextResponse.json({ error: listResult.error }, { status: 500 });
    }

    return NextResponse.json(listResult.data);
  } catch (err) {
    logError("API_ADMIN_USERS_GET", err, { route: "/api/admin/users" });
    return NextResponse.json(
      { error: "Impossible de charger les utilisateurs." },
      { status: 500 },
    );
  }
}
