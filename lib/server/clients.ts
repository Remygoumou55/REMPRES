import type { Client } from "@/types/client";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/lib/validations/client";

type ClientListParams = {
  search?: string;
  type?: "individual" | "company" | "all";
  page?: number;
  pageSize?: 10 | 25 | 50;
};

type ClientListResult = {
  data: Client[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type RequestContext = {
  ip?: string | null;
  userAgent?: string | null;
};

const CLIENT_COLUMNS =
  "id,client_type,first_name,last_name,company_name,email,phone,address,city,country,notes,created_by,created_at,updated_at,deleted_at";

function normalizePagination(page?: number, pageSize?: number) {
  const safePage = Number.isInteger(page) && (page ?? 1) > 0 ? (page as number) : 1;
  const allowedPageSizes: Array<10 | 25 | 50> = [10, 25, 50];
  const safePageSize = allowedPageSizes.includes(pageSize as 10 | 25 | 50)
    ? (pageSize as 10 | 25 | 50)
    : 10;

  return { safePage, safePageSize };
}

function normalizeSearch(search?: string) {
  const trimmed = search?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "";
}

function getClientsTable() {
  const supabase = getSupabaseServerClient();
  return supabase.from("clients");
}

async function createActivityLog(params: {
  actorUserId: string;
  actionKey: "create" | "update" | "delete";
  targetId?: string;
  metadata?: Json;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("activity_logs").insert({
    actor_user_id: params.actorUserId,
    module_key: "clients",
    action_key: params.actionKey,
    target_table: "clients",
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(`Impossible d'écrire le journal d'activité: ${error.message}`);
  }
}

function sanitizeClientForLog(client: Client | null) {
  if (!client) return null;
  const maskedEmail =
    client.email && client.email.includes("@")
      ? `${client.email.slice(0, 2)}***@${client.email.split("@")[1]}`
      : client.email;
  const maskedPhone = client.phone ? `${"*".repeat(Math.max(0, client.phone.length - 4))}${client.phone.slice(-4)}` : client.phone;

  return {
    id: client.id,
    client_type: client.client_type,
    first_name: client.first_name,
    last_name: client.last_name,
    company_name: client.company_name,
    email: maskedEmail,
    phone: maskedPhone,
    city: client.city,
    country: client.country,
    deleted_at: client.deleted_at,
  };
}

export async function listClients(params: ClientListParams = {}): Promise<ClientListResult> {
  const { safePage, safePageSize } = normalizePagination(params.page, params.pageSize);
  const search = normalizeSearch(params.search);
  const type = params.type ?? "all";
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  let query = getClientsTable()
    .select(CLIENT_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (type !== "all") {
    query = query.eq("client_type", type);
  }

  if (search) {
    const escapedSearch = search.replace(/,/g, "\\,");
    query = query.or(
      `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,company_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%`,
    );
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    throw new Error(`Impossible de charger la liste des clients: ${error.message}`);
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / safePageSize);

  return {
    data: (data ?? []) as Client[],
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
  };
}

export async function getClientById(id: string): Promise<Client | null> {
  if (!id || !id.trim()) {
    throw new Error("ID client invalide");
  }

  const { data, error } = await getClientsTable()
    .select(CLIENT_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de récupérer le client: ${error.message}`);
  }

  return (data ?? null) as Client | null;
}

export async function createClient(
  input: CreateClientInput,
  userId: string,
  context?: RequestContext,
): Promise<Client> {
  if (!userId || !userId.trim()) {
    throw new Error("Utilisateur non authentifié");
  }

  const validated = createClientSchema.parse(input);
  const payload = { ...validated, created_by: userId };

  const { data, error } = await getClientsTable()
    .insert(payload)
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Impossible de créer le client: ${error.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "create",
      targetId: data.id,
      metadata: {
        before: null,
        after: sanitizeClientForLog(data as Client),
        context: {
          ip: context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
        },
      },
    });
  } catch (logError) {
    console.error("[ActivityLog] Failed to log client create:", logError);
  }

  return data as Client;
}

export async function updateClient(
  id: string,
  input: Omit<UpdateClientInput, "id">,
  userId: string,
  context?: RequestContext,
): Promise<Client> {
  if (!id || !id.trim()) {
    throw new Error("ID client invalide");
  }

  const validated = updateClientSchema.parse({ id, ...input });
  const payload = {
    client_type: validated.client_type,
    first_name: validated.first_name,
    last_name: validated.last_name,
    company_name: validated.company_name,
    email: validated.email,
    phone: validated.phone,
    address: validated.address,
    city: validated.city,
    country: validated.country,
    notes: validated.notes,
  };

  const previousClient = await getClientById(id);
  if (!previousClient) {
    throw new Error("Client introuvable");
  }

  const { data, error } = await getClientsTable()
    .update(payload)
    .eq("id", id)
    .is("deleted_at", null)
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Impossible de mettre à jour le client: ${error.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "update",
      targetId: data.id,
      metadata: {
        before: sanitizeClientForLog(previousClient),
        after: sanitizeClientForLog(data as Client),
        context: {
          ip: context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
        },
      },
    });
  } catch (logError) {
    console.error("[ActivityLog] Failed to log client update:", logError);
  }

  return data as Client;
}

export async function softDeleteClient(
  id: string,
  userId: string,
  context?: RequestContext,
): Promise<{ success: true }> {
  if (!id || !id.trim()) {
    throw new Error("ID client invalide");
  }

  const previousClient = await getClientById(id);
  if (!previousClient) {
    throw new Error("Client introuvable");
  }

  const { error } = await getClientsTable()
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Impossible de supprimer le client: ${error.message}`);
  }

  try {
    await createActivityLog({
      actorUserId: userId,
      actionKey: "delete",
      targetId: id,
      metadata: {
        before: sanitizeClientForLog(previousClient),
        after: null,
        context: {
          ip: context?.ip ?? null,
          userAgent: context?.userAgent ?? null,
        },
      },
    });
  } catch (logError) {
    console.error("[ActivityLog] Failed to log client delete:", logError);
  }

  return { success: true };
}
