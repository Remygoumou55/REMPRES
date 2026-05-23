import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { safeRows } from "@/lib/utils/safe-query";
import type { ActivityItem } from "@/components/dashboard/activity-feed";

type ActivityLogRow = {
  id: string;
  action_key: string;
  module_key: string;
  created_at: string;
  actor_user_id: string | null;
};

function formatModuleLabel(key: string): string {
  const map: Record<string, string> = {
    clients: "Clients",
    produits: "Produits",
    vente: "Vente",
    finance: "Finance",
    rh: "RH",
    formation: "Formation",
    consultation: "Consultation",
    marketing: "Marketing",
    logistique: "Logistique",
    parametres: "Paramètres",
    depenses: "Dépenses",
  };
  return map[key] ?? key;
}

function normalizeAction(actionKey: string, moduleKey: string): ActivityItem["action"] {
  const key = actionKey.toLowerCase();
  if (key === "create") return moduleKey === "vente" ? "sale" : "create";
  if (key === "update") return "update";
  if (key === "delete") return "delete";
  if (key === "restore") return "restore";
  if (key === "sale") return "sale";
  if (key === "payment" || key === "pay") return "payment";
  if (key === "approve") return "update";
  return "update";
}

export async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  options?: {
    moduleKeys?: string[];
    excludeModules?: string[];
    excludeActions?: string[];
    limit?: number;
  },
): Promise<ActivityItem[]> {
  const excludeMods = options?.excludeModules ?? ["audit"];
  const excludeActs = options?.excludeActions ?? ["read"];
  const limit = options?.limit ?? 6;

  let query = supabase
    .from("activity_logs")
    .select("id, action_key, module_key, created_at, actor_user_id")
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  if (options?.moduleKeys?.length) {
    query = query.in("module_key", options.moduleKeys);
  }

  const rows = await safeRows<ActivityLogRow>(query);
  const filtered = rows.filter(
    (r) => !excludeMods.includes(r.module_key) && !excludeActs.includes(r.action_key.toLowerCase()),
  );

  const actorIds = Array.from(
    new Set(filtered.map((r) => r.actor_user_id).filter(Boolean) as string[]),
  );
  const actorNames = new Map<string, string>();
  if (actorIds.length > 0) {
    const profiles = await safeRows<{ id: string; first_name: string | null; last_name: string | null }>(
      supabase.from("profiles").select("id, first_name, last_name").in("id", actorIds),
    );
    for (const p of profiles) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
      if (name) actorNames.set(p.id, name);
    }
  }

  return filtered.slice(0, limit).map((r) => {
    const actor = (r.actor_user_id && actorNames.get(r.actor_user_id)) || "Utilisateur";
    return {
      id: r.id,
      action: normalizeAction(r.action_key, r.module_key),
      module: formatModuleLabel(r.module_key),
      actor,
      timeAgo: formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr }),
    };
  });
}
