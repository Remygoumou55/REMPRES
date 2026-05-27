import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export type Webhook = {
  id: string;
  name: string;
  description: string | null;
  direction: "incoming" | "outgoing";
  target_url: string | null;
  secret_token: string;
  events: string[];
  http_method: string;
  is_active: boolean;
  delivery_count: number;
  failure_count: number;
  last_triggered_at: string | null;
  created_at: string;
};

export type WebhookDelivery = {
  id: string;
  webhook_id: string;
  direction: string;
  event_type: string | null;
  payload: Record<string, unknown>;
  response_code: number | null;
  status: "pending" | "delivered" | "failed" | "received";
  error_message: string | null;
  duration_ms: number | null;
  delivered_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapWebhook(row: Record<string, unknown>): Webhook {
  const eventsRaw = row.events;
  const events = Array.isArray(eventsRaw)
    ? eventsRaw.map((e) => String(e))
    : [];

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: row.description ? String(row.description) : null,
    direction: row.direction === "incoming" ? "incoming" : "outgoing",
    target_url: row.target_url ? String(row.target_url) : null,
    secret_token: String(row.secret_token ?? ""),
    events,
    http_method: String(row.http_method ?? "POST"),
    is_active: Boolean(row.is_active ?? true),
    delivery_count: Number(row.delivery_count ?? 0),
    failure_count: Number(row.failure_count ?? 0),
    last_triggered_at: row.last_triggered_at ? String(row.last_triggered_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapDelivery(row: Record<string, unknown>): WebhookDelivery {
  const status = String(row.status ?? "pending");
  const normalizedStatus =
    status === "delivered" || status === "failed" || status === "received"
      ? status
      : "pending";

  return {
    id: String(row.id ?? ""),
    webhook_id: String(row.webhook_id ?? ""),
    direction: String(row.direction ?? ""),
    event_type: row.event_type ? String(row.event_type) : null,
    payload: asRecord(row.payload),
    response_code: row.response_code != null ? Number(row.response_code) : null,
    status: normalizedStatus as WebhookDelivery["status"],
    error_message: row.error_message ? String(row.error_message) : null,
    duration_ms: row.duration_ms != null ? Number(row.duration_ms) : null,
    delivered_at: String(row.delivered_at ?? new Date().toISOString()),
  };
}

export async function listWebhooks(): Promise<{
  data: Webhook[];
  incoming_count: number;
  outgoing_count: number;
}> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("webhooks" as never)
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { data: [], incoming_count: 0, outgoing_count: 0 };
  }

  const mapped = (data as Record<string, unknown>[]).map(mapWebhook);
  const active = mapped.filter((w) => w.is_active);

  return {
    data: mapped,
    incoming_count: active.filter((w) => w.direction === "incoming").length,
    outgoing_count: active.filter((w) => w.direction === "outgoing").length,
  };
}

export async function getWebhookById(id: string): Promise<Webhook | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("webhooks" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapWebhook(data as Record<string, unknown>);
}

export async function getWebhookByToken(token: string): Promise<Webhook | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("webhooks" as never)
    .select("*")
    .eq("secret_token", token)
    .eq("direction", "incoming")
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapWebhook(data as Record<string, unknown>);
}

/** Route publique entrante — contourne RLS via service role. */
export async function getWebhookByTokenForIncomingRoute(
  token: string,
): Promise<Webhook | null> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("webhooks" as never)
      .select("*")
      .eq("secret_token", token)
      .eq("direction", "incoming")
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !data) return null;
    return mapWebhook(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function createWebhook(input: {
  name: string;
  description?: string;
  direction: "incoming" | "outgoing";
  target_url?: string;
  events?: string[];
  http_method?: string;
  created_by: string;
}): Promise<{
  success: boolean;
  id?: string;
  secret_token?: string;
  error?: string;
}> {
  try {
    const supabase = getSupabaseServerClient();
    const payload = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      direction: input.direction,
      target_url: input.target_url?.trim() || null,
      events: input.events ?? [],
      http_method: input.http_method?.trim() || "POST",
      created_by: input.created_by,
    };

    const { data, error } = await supabase
      .from("webhooks" as never)
      .insert(payload as never)
      .select("id, secret_token")
      .single();

    if (error) return { success: false, error: error.message };
    const row = data as { id?: string; secret_token?: string };
    return {
      success: true,
      id: String(row.id ?? ""),
      secret_token: String(row.secret_token ?? ""),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Création impossible.",
    };
  }
}

export async function updateWebhook(
  id: string,
  input: {
    name?: string;
    description?: string;
    target_url?: string;
    events?: string[];
    http_method?: string;
    is_active?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof input.name === "string") payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.target_url !== undefined) payload.target_url = input.target_url?.trim() || null;
    if (input.events !== undefined) payload.events = input.events;
    if (typeof input.http_method === "string") payload.http_method = input.http_method;
    if (input.is_active !== undefined) payload.is_active = input.is_active;

    const { error } = await supabase
      .from("webhooks" as never)
      .update(payload as never)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Mise à jour impossible.",
    };
  }
}

export async function deleteWebhook(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("webhooks" as never)
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Suppression impossible.",
    };
  }
}

export async function toggleWebhook(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  return updateWebhook(id, { is_active: isActive });
}

export async function listDeliveries(
  webhookId: string,
  limit = 20,
): Promise<WebhookDelivery[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("webhook_deliveries" as never)
    .select("*")
    .eq("webhook_id", webhookId)
    .order("delivered_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapDelivery);
}

export async function logDelivery(
  input: {
    webhook_id: string;
    direction: string;
    event_type?: string;
    payload: Record<string, unknown>;
    response_code?: number;
    response_body?: string;
    status: string;
    error_message?: string;
    duration_ms?: number;
  },
  options?: { serviceRole?: boolean },
): Promise<void> {
  try {
    const supabase = options?.serviceRole
      ? getSupabaseAdminClient()
      : getSupabaseServerClient();

    await supabase.from("webhook_deliveries" as never).insert({
      webhook_id: input.webhook_id,
      direction: input.direction,
      event_type: input.event_type ?? null,
      payload: input.payload,
      response_code: input.response_code ?? null,
      response_body: input.response_body ?? null,
      status: input.status,
      error_message: input.error_message ?? null,
      duration_ms: input.duration_ms ?? null,
    } as never);

    await supabase.rpc("increment_webhook_delivery_stats" as never, {
      p_webhook_id: input.webhook_id,
      p_failed: input.status === "failed",
    } as never);
  } catch (err) {
    console.error("[Webhooks] logDelivery error:", err);
  }
}

function webhookMatchesEvent(events: string[], eventType: string): boolean {
  if (events.includes("*")) return true;
  return events.includes(eventType);
}

async function deliverToWebhook(
  webhook: Webhook,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!webhook.target_url) {
    await logDelivery({
      webhook_id: webhook.id,
      direction: "outgoing",
      event_type: eventType,
      payload,
      status: "failed",
      error_message: "URL cible manquante",
    });
    return;
  }

  const t0 = Date.now();
  const body = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
    source: "RemPres ERP",
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const method = webhook.http_method || "POST";
    const init: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-RemPres-Event": eventType,
        "X-RemPres-Token": webhook.secret_token,
      },
      signal: controller.signal,
      cache: "no-store",
    };
    if (method !== "GET") {
      init.body = JSON.stringify(body);
    }
    const res = await fetch(webhook.target_url, init);

    clearTimeout(timeout);
    const responseText = await res.text().catch(() => "");

    await logDelivery({
      webhook_id: webhook.id,
      direction: "outgoing",
      event_type: eventType,
      payload: body,
      response_code: res.status,
      response_body: responseText.slice(0, 2000),
      status: res.ok ? "delivered" : "failed",
      error_message: res.ok ? undefined : `HTTP ${res.status}`,
      duration_ms: Date.now() - t0,
    });
  } catch (err) {
    clearTimeout(timeout);
    await logDelivery({
      webhook_id: webhook.id,
      direction: "outgoing",
      event_type: eventType,
      payload: body,
      status: "failed",
      error_message: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - t0,
    });
  }
}

export async function dispatchOutgoingWebhook(input: {
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("webhooks" as never)
      .select("*")
      .eq("direction", "outgoing")
      .eq("is_active", true)
      .is("deleted_at", null);

    if (error || !data?.length) return;

    const webhooks = (data as Record<string, unknown>[])
      .map(mapWebhook)
      .filter((w) => webhookMatchesEvent(w.events, input.eventType));

    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          await deliverToWebhook(webhook, input.eventType, input.payload);
        } catch (err) {
          console.error(`[Webhooks] dispatch failed for ${webhook.id}:`, err);
        }
      }),
    );
  } catch (err) {
    console.error("[Webhooks] dispatchOutgoingWebhook error:", err);
  }
}
