import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";

export type ActivityLogItem = {
  id: string;
  actor_user_id: string;
  module_key: string;
  action_key: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Json;
  created_at: string;
};

export type ActivityLogsResult = {
  data: ActivityLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ActivityLogsFilters = {
  moduleKey?: string;
  actionKey?: string;
  actorUserId?: string;
  targetId?: string;
  from?: string;
  to?: string;
};

function maskSensitiveInString(value: string) {
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const phoneRegex = /\b\d{6,}\b/g;
  return value
    .replace(emailRegex, (match) => `${match.slice(0, 2)}***`)
    .replace(phoneRegex, (match) => `${"*".repeat(Math.max(0, match.length - 4))}${match.slice(-4)}`);
}

function maskSensitiveJson(value: Json): Json {
  if (value === null) return null;
  if (typeof value === "string") return maskSensitiveInString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => maskSensitiveJson(item as Json));

  const output: Record<string, Json> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    if (key.toLowerCase().includes("email")) {
      output[key] = typeof child === "string" ? `${child.slice(0, 2)}***` : "***";
      continue;
    }
    if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("telephone")) {
      output[key] = typeof child === "string" ? `${"*".repeat(Math.max(0, child.length - 4))}${child.slice(-4)}` : "***";
      continue;
    }
    output[key] = maskSensitiveJson(child as Json);
  }
  return output;
}

const DAY = /^(\d{4}-\d{2}-\d{2})$/;

/** Borne un filtre "jour" (input type=date) sur toute la journée en UTC. */
function dayStartUtc(isoDay: string): string {
  return `${isoDay}T00:00:00.000Z`;
}
function dayEndUtc(isoDay: string): string {
  return `${isoDay}T23:59:59.999Z`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters?: ActivityLogsFilters) {
  let nextQuery = query;
  if (filters?.moduleKey) nextQuery = nextQuery.eq("module_key", filters.moduleKey);
  if (filters?.actionKey) nextQuery = nextQuery.eq("action_key", filters.actionKey);
  if (filters?.actorUserId) nextQuery = nextQuery.eq("actor_user_id", filters.actorUserId);
  if (filters?.targetId) nextQuery = nextQuery.ilike("target_id", `%${filters.targetId}%`);

  const fromRaw = filters?.from?.trim();
  const toRaw   = filters?.to?.trim();
  const fromDay = fromRaw && DAY.test(fromRaw) ? fromRaw : null;
  const toDay   = toRaw && DAY.test(toRaw) ? toRaw : null;

  if (fromDay) {
    const start = dayStartUtc(fromDay);
    let end: string;
    if (toDay) {
      end = dayEndUtc(toDay);
    } else if (toRaw && !toDay) {
      end = toRaw;
    } else {
      end = dayEndUtc(fromDay);
    }
    nextQuery = nextQuery.gte("created_at", start).lte("created_at", end);
  } else {
    if (fromRaw) nextQuery = nextQuery.gte("created_at", fromRaw);
    if (toRaw) {
      const lteVal = toDay ? dayEndUtc(toDay) : toRaw;
      nextQuery = nextQuery.lte("created_at", lteVal);
    }
  }

  return nextQuery;
}

export async function listActivityLogs(params?: {
  page?: number;
  pageSize?: 10 | 25 | 50;
  filters?: ActivityLogsFilters;
}): Promise<ActivityLogsResult> {
  const safePage = Number.isInteger(params?.page) && (params?.page ?? 1) > 0 ? (params?.page as number) : 1;
  const safePageSize = [10, 25, 50].includes(params?.pageSize as 10 | 25 | 50)
    ? (params?.pageSize as 10 | 25 | 50)
    : 10;
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const supabase = getSupabaseServerClient();
  const query = applyFilters(
    supabase
    .from("activity_logs")
    .select("id,actor_user_id,module_key,action_key,target_table,target_id,metadata,created_at", {
      count: "exact",
    }),
    params?.filters,
  );
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Impossible de charger les journaux d'activité: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);
  const safeData = ((data ?? []) as ActivityLogItem[]).map((item) => ({
    ...item,
    metadata: maskSensitiveJson(item.metadata),
  }));
  return {
    data: safeData,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function exportActivityLogsCsv(filters?: ActivityLogsFilters): Promise<string> {
  const supabase = getSupabaseServerClient();
  const query = applyFilters(
    supabase
      .from("activity_logs")
      .select("id,actor_user_id,module_key,action_key,target_table,target_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    filters,
  );
  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible d'exporter les journaux d'activité: ${error.message}`);
  }

  const rows = (data ?? []) as ActivityLogItem[];
  const header = "created_at,actor_user_id,module_key,action_key,target_table,target_id,metadata";
  const lines = rows.map((row) => {
    const metadata = JSON.stringify(maskSensitiveJson(row.metadata));
    return [
      row.created_at,
      row.actor_user_id,
      row.module_key,
      row.action_key,
      row.target_table ?? "",
      row.target_id ?? "",
      metadata,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(",");
  });

  return [header, ...lines].join("\n");
}

export async function getActivityLogsMonitoring(filters?: ActivityLogsFilters) {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const query = applyFilters(
    supabase
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("action_key", "delete")
      .gte("created_at", since),
    filters,
  );
  const { count, error } = await query;

  if (error) {
    throw new Error(`Impossible de calculer la supervision des logs: ${error.message}`);
  }

  return {
    deleteCountLast24h: count ?? 0,
    alertLevel: (count ?? 0) >= 5 ? "warning" : "normal",
  } as const;
}

// ---------------------------------------------------------------------------
// Signed JSON export + integrity verification
// ---------------------------------------------------------------------------

function computeSha256(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export type SignedActivityLogsExport = {
  data: ActivityLogItem[];
  checksum: string;
  exportedAt: string;
};

export async function exportActivityLogsSignedJson(
  filters?: ActivityLogsFilters,
): Promise<SignedActivityLogsExport> {
  const supabase = getSupabaseServerClient();
  const query = applyFilters(
    supabase
      .from("activity_logs")
      .select("id,actor_user_id,module_key,action_key,target_table,target_id,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    filters,
  );
  const { data, error } = await query;

  if (error) {
    throw new Error(`Impossible d'exporter les journaux d'activité: ${error.message}`);
  }

  const rows = ((data ?? []) as ActivityLogItem[]).map((item) => ({
    ...item,
    metadata: maskSensitiveJson(item.metadata),
  }));

  const checksum = computeSha256(JSON.stringify(rows));

  return {
    data: rows,
    checksum,
    exportedAt: new Date().toISOString(),
  };
}

export function verifyActivityLogsSignedJsonIntegrity(
  input: unknown,
): { valid: boolean; reason?: string } {
  if (
    !input ||
    typeof input !== "object" ||
    !("data" in input) ||
    !("checksum" in input) ||
    !("exportedAt" in input)
  ) {
    return { valid: false, reason: "Format de fichier invalide." };
  }

  const { data, checksum } = input as {
    data: unknown;
    checksum: unknown;
    exportedAt: unknown;
  };

  if (!Array.isArray(data) || typeof checksum !== "string") {
    return { valid: false, reason: "Structure du fichier incorrecte." };
  }

  const recomputed = computeSha256(JSON.stringify(data));

  if (recomputed !== checksum) {
    return {
      valid: false,
      reason: "checksum mismatch",
    };
  }

  return { valid: true };
}
