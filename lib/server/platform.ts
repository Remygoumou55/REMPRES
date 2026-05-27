import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  API_STATUS_COLORS,
  API_STATUS_LABELS,
  API_TYPE_COLORS,
  API_TYPE_LABELS,
  CONNECTOR_STATUS_COLORS,
  CONNECTOR_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants/platform";

export type ApiEntry = {
  id: string;
  name: string;
  description: string | null;
  endpoint_url: string | null;
  api_type: "internal" | "external" | "webhook";
  status: "active" | "inactive" | "deprecated";
  version: string;
  call_count: number;
  last_called_at: string | null;
  auth_type: string;
  rate_limit_per_hour: number;
  notes: string | null;
  created_at: string;
};

export type ConnectorInstance = {
  id: string;
  name: string;
  service_type: string;
  status: "active" | "inactive" | "error" | "pending";
  description: string | null;
  config_json: Record<string, unknown>;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
};

export {
  API_STATUS_COLORS,
  API_STATUS_LABELS,
  API_TYPE_COLORS,
  API_TYPE_LABELS,
  CONNECTOR_STATUS_COLORS,
  CONNECTOR_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
};

const API_TYPES = new Set(["internal", "external", "webhook"]);
const API_STATUSES = new Set(["active", "inactive", "deprecated"]);
const CONNECTOR_STATUSES = new Set(["active", "inactive", "error", "pending"]);

function normalizeApiType(value: string): ApiEntry["api_type"] {
  return API_TYPES.has(value) ? (value as ApiEntry["api_type"]) : "internal";
}

function normalizeApiStatus(value: string): ApiEntry["status"] {
  return API_STATUSES.has(value) ? (value as ApiEntry["status"]) : "active";
}

function normalizeConnectorStatus(value: string): ConnectorInstance["status"] {
  return CONNECTOR_STATUSES.has(value) ? (value as ConnectorInstance["status"]) : "inactive";
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapApiRow(row: Record<string, unknown>): ApiEntry {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: row.description ? String(row.description) : null,
    endpoint_url: row.endpoint_url ? String(row.endpoint_url) : null,
    api_type: normalizeApiType(String(row.api_type ?? "internal")),
    status: normalizeApiStatus(String(row.status ?? "active")),
    version: String(row.version ?? "v1"),
    call_count: Number(row.call_count ?? 0),
    last_called_at: row.last_called_at ? String(row.last_called_at) : null,
    auth_type: String(row.auth_type ?? "none"),
    rate_limit_per_hour: Number(row.rate_limit_per_hour ?? 1000),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapConnectorRow(row: Record<string, unknown>): ConnectorInstance {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    service_type: String(row.service_type ?? "other"),
    status: normalizeConnectorStatus(String(row.status ?? "inactive")),
    description: row.description ? String(row.description) : null,
    config_json: asRecord(row.config_json),
    last_sync_at: row.last_sync_at ? String(row.last_sync_at) : null,
    error_message: row.error_message ? String(row.error_message) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function listApis(): Promise<{ data: ApiEntry[]; total: number; active_count: number }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_platform_api_registry" as never)
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) return { data: [], total: 0, active_count: 0 };
  const mapped = ((data as Record<string, unknown>[] | null) ?? []).map(mapApiRow);
  return {
    data: mapped,
    total: mapped.length,
    active_count: mapped.filter((item) => item.status === "active").length,
  };
}

export async function createApi(input: {
  name: string;
  description?: string;
  endpoint_url?: string;
  api_type: string;
  status?: string;
  version?: string;
  auth_type?: string;
  rate_limit_per_hour?: number;
  notes?: string;
  created_by: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const payload = {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      endpoint_url: input.endpoint_url?.trim() || null,
      api_type: normalizeApiType(input.api_type),
      status: normalizeApiStatus(input.status ?? "active"),
      version: input.version?.trim() || "v1",
      auth_type: input.auth_type?.trim() || "none",
      rate_limit_per_hour: Number(input.rate_limit_per_hour ?? 1000),
      notes: input.notes?.trim() || null,
      created_by: input.created_by,
    };

    const { data, error } = await supabase
      .from("erp_platform_api_registry" as never)
      .insert(payload as never)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, id: String((data as { id?: string } | null)?.id ?? "") };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Creation impossible." };
  }
}

export async function updateApi(
  id: string,
  input: Partial<Omit<ApiEntry, "id" | "created_at">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof input.name === "string") payload.name = input.name.trim();
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.endpoint_url !== undefined) payload.endpoint_url = input.endpoint_url?.trim() || null;
    if (typeof input.api_type === "string") payload.api_type = normalizeApiType(input.api_type);
    if (typeof input.status === "string") payload.status = normalizeApiStatus(input.status);
    if (typeof input.version === "string") payload.version = input.version.trim() || "v1";
    if (typeof input.auth_type === "string") payload.auth_type = input.auth_type.trim() || "none";
    if (input.rate_limit_per_hour !== undefined) {
      payload.rate_limit_per_hour = Number(input.rate_limit_per_hour);
    }
    if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;
    if (input.call_count !== undefined) payload.call_count = Number(input.call_count);
    if (input.last_called_at !== undefined) payload.last_called_at = input.last_called_at;

    const { error } = await supabase
      .from("erp_platform_api_registry" as never)
      .update(payload as never)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mise a jour impossible." };
  }
}

export async function deleteApi(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("erp_platform_api_registry" as never)
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Suppression impossible." };
  }
}

export async function pingApi(endpointUrl: string): Promise<{
  reachable: boolean;
  latency_ms: number | null;
  status_code: number | null;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const t0 = Date.now();
    try {
      const res = await fetch(endpointUrl, { method: "HEAD", signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);
      return {
        reachable: res.ok,
        latency_ms: Date.now() - t0,
        status_code: res.status,
      };
    } catch {
      const res = await fetch(endpointUrl, { method: "GET", signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);
      return {
        reachable: res.ok,
        latency_ms: Date.now() - t0,
        status_code: res.status,
      };
    }
  } catch (error) {
    return {
      reachable: false,
      latency_ms: null,
      status_code: null,
      error: error instanceof Error ? error.message : "Endpoint inaccessible.",
    };
  }
}

export async function listConnectors(): Promise<{
  data: ConnectorInstance[];
  total: number;
  active_count: number;
}> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_platform_connector_instances" as never)
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) return { data: [], total: 0, active_count: 0 };
  const mapped = ((data as Record<string, unknown>[] | null) ?? []).map(mapConnectorRow);
  return {
    data: mapped,
    total: mapped.length,
    active_count: mapped.filter((item) => item.status === "active").length,
  };
}

export async function createConnector(input: {
  name: string;
  service_type: string;
  description?: string;
  status?: string;
  created_by: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const payload = {
      name: input.name.trim(),
      service_type: input.service_type.trim() || "other",
      status: normalizeConnectorStatus(input.status ?? "inactive"),
      description: input.description?.trim() || null,
      created_by: input.created_by,
      config_json: {},
    };
    const { data, error } = await supabase
      .from("erp_platform_connector_instances" as never)
      .insert(payload as never)
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    return { success: true, id: String((data as { id?: string } | null)?.id ?? "") };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Creation impossible." };
  }
}

export async function updateConnector(
  id: string,
  input: Partial<ConnectorInstance>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof input.name === "string") payload.name = input.name.trim();
    if (typeof input.service_type === "string") payload.service_type = input.service_type.trim() || "other";
    if (typeof input.status === "string") payload.status = normalizeConnectorStatus(input.status);
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.config_json !== undefined) payload.config_json = input.config_json;
    if (input.last_sync_at !== undefined) payload.last_sync_at = input.last_sync_at;
    if (input.error_message !== undefined) payload.error_message = input.error_message;

    const { error } = await supabase
      .from("erp_platform_connector_instances" as never)
      .update(payload as never)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Mise a jour impossible." };
  }
}

export async function deleteConnector(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("erp_platform_connector_instances" as never)
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Suppression impossible." };
  }
}

export async function toggleConnector(
  id: string,
  newStatus: "active" | "inactive",
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("erp_platform_connector_instances" as never)
      .update({ status: newStatus, updated_at: new Date().toISOString() } as never)
      .eq("id", id)
      .is("deleted_at", null);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Bascule impossible." };
  }
}
