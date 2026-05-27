import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { recordStockMovement } from "@/lib/server/logistique";
import { safeRows } from "@/lib/utils/safe-query";

export type InventorySessionStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "validated";

export type InventorySession = {
  id: string;
  name: string;
  status: InventorySessionStatus;
  started_at: string | null;
  completed_at: string | null;
  validated_at: string | null;
  notes: string | null;
  total_items_counted: number;
  total_discrepancies: number;
  created_at: string;
};

export type InventoryLine = {
  id: string;
  session_id: string;
  product_id: string;
  product_name: string;
  sku: string | null;
  theoretical_quantity: number;
  counted_quantity: number | null;
  discrepancy: number | null;
  unit: string;
  location: string | null;
  notes: string | null;
  counted_at: string | null;
};

type StockItemSnapshot = {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unit: string;
  warehouse: { label: string } | { label: string }[] | null;
};

function mapSession(row: Record<string, unknown>): InventorySession {
  return {
    id: String(row.id),
    name: String(row.name),
    status: row.status as InventorySessionStatus,
    started_at: row.started_at ? String(row.started_at) : null,
    completed_at: row.completed_at ? String(row.completed_at) : null,
    validated_at: row.validated_at ? String(row.validated_at) : null,
    notes: row.notes ? String(row.notes) : null,
    total_items_counted: Number(row.total_items_counted ?? 0),
    total_discrepancies: Number(row.total_discrepancies ?? 0),
    created_at: String(row.created_at),
  };
}

function mapLine(row: Record<string, unknown>): InventoryLine {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    product_id: String(row.product_id),
    product_name: String(row.product_name),
    sku: row.sku ? String(row.sku) : null,
    theoretical_quantity: Number(row.theoretical_quantity ?? 0),
    counted_quantity:
      row.counted_quantity === null || row.counted_quantity === undefined
        ? null
        : Number(row.counted_quantity),
    discrepancy:
      row.discrepancy === null || row.discrepancy === undefined
        ? null
        : Number(row.discrepancy),
    unit: String(row.unit ?? "unité"),
    location: row.location ? String(row.location) : null,
    notes: row.notes ? String(row.notes) : null,
    counted_at: row.counted_at ? String(row.counted_at) : null,
  };
}

function warehouseLabel(
  warehouse: StockItemSnapshot["warehouse"],
): string | null {
  if (!warehouse) return null;
  if (Array.isArray(warehouse)) {
    return warehouse[0]?.label ?? null;
  }
  return warehouse.label ?? null;
}

export async function createInventorySession(input: {
  name: string;
  notes?: string;
  userId: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const name = input.name.trim();
  if (!name) return { success: false, error: "Le nom est requis." };

  const { data: session, error: sessionError } = await supabase
    .from("inventory_sessions" as never)
    .insert({
      name,
      notes: input.notes?.trim() || null,
      created_by: input.userId,
      status: "draft",
    } as never)
    .select("id")
    .single();

  if (sessionError || !session) {
    return { success: false, error: sessionError?.message ?? "Création impossible." };
  }

  const sessionId = String((session as { id: string }).id);

  const items = await safeRows<StockItemSnapshot>(
    supabase
      .from("stock_items" as never)
      .select("id,name,sku,quantity,unit,warehouse:logistics_warehouses(label)")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  );

  if (items.length > 0) {
    const lines = items.map((item) => ({
      session_id: sessionId,
      product_id: item.id,
      product_name: item.name,
      sku: item.sku,
      theoretical_quantity: Number(item.quantity ?? 0),
      unit: item.unit ?? "unité",
      location: warehouseLabel(item.warehouse),
    }));

    const { error: linesError } = await supabase
      .from("inventory_lines" as never)
      .insert(lines as never);

    if (linesError) {
      await supabase
        .from("inventory_sessions" as never)
        .delete()
        .eq("id", sessionId);
      return { success: false, error: linesError.message };
    }
  }

  return { success: true, id: sessionId };
}

export async function listInventorySessions(): Promise<{
  data: InventorySession[];
  total: number;
}> {
  const supabase = getSupabaseServerClient();
  const result = await supabase
    .from("inventory_sessions" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (result.error) return { data: [], total: 0 };
  const data = (result.data ?? []).map((r) =>
    mapSession(r as Record<string, unknown>),
  );
  return { data, total: result.count ?? data.length };
}

export async function getInventorySession(
  id: string,
): Promise<InventorySession | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_sessions" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapSession(data as Record<string, unknown>);
}

export async function getInventoryLines(
  sessionId: string,
): Promise<InventoryLine[]> {
  const supabase = getSupabaseServerClient();
  const rows = await safeRows<Record<string, unknown>>(
    supabase
      .from("inventory_lines" as never)
      .select("*")
      .eq("session_id", sessionId)
      .order("product_name", { ascending: true }),
  );
  return rows.map(mapLine);
}

export async function updateInventoryLine(input: {
  lineId: string;
  countedQuantity: number;
  notes?: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const qty = Number(input.countedQuantity);
  if (qty < 0) return { success: false, error: "Quantité invalide." };

  const { data: line, error: lineError } = await supabase
    .from("inventory_lines" as never)
    .select("session_id")
    .eq("id", input.lineId)
    .maybeSingle();

  if (lineError || !line) {
    return { success: false, error: "Ligne introuvable." };
  }

  const session = await getInventorySession(
    String((line as { session_id: string }).session_id),
  );
  if (!session || session.status !== "in_progress") {
    return { success: false, error: "Session non modifiable." };
  }

  const { error } = await supabase
    .from("inventory_lines" as never)
    .update({
      counted_quantity: qty,
      notes: input.notes?.trim() || null,
      counted_at: new Date().toISOString(),
      counted_by: input.userId,
    } as never)
    .eq("id", input.lineId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function startInventorySession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getInventorySession(sessionId);
  if (!session) return { success: false, error: "Session introuvable." };
  if (session.status !== "draft") {
    return { success: false, error: "Seul un brouillon peut être démarré." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("inventory_sessions" as never)
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    } as never)
    .eq("id", sessionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function completeInventorySession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await getInventorySession(sessionId);
  if (!session) return { success: false, error: "Session introuvable." };
  if (session.status !== "in_progress") {
    return { success: false, error: "La session doit être en cours." };
  }

  const lines = await getInventoryLines(sessionId);
  const uncounted = lines.filter((l) => l.counted_quantity === null);
  if (uncounted.length > 0) {
    return {
      success: false,
      error: `${uncounted.length} article(s) sans comptage physique.`,
    };
  }

  const totalItemsCounted = lines.length;
  const totalDiscrepancies = lines.filter(
    (l) => l.discrepancy !== null && l.discrepancy !== 0,
  ).length;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("inventory_sessions" as never)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      total_items_counted: totalItemsCounted,
      total_discrepancies: totalDiscrepancies,
    } as never)
    .eq("id", sessionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function validateInventorySession(input: {
  sessionId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getInventorySession(input.sessionId);
  if (!session) return { success: false, error: "Session introuvable." };
  if (session.status !== "completed") {
    return { success: false, error: "La session doit être terminée avant validation." };
  }

  const lines = await getInventoryLines(input.sessionId);

  for (const line of lines) {
    const disc = line.discrepancy;
    if (disc === null || disc === 0) continue;

    const movement =
      disc > 0
        ? await recordStockMovement({
            item_id: line.product_id,
            type: "in",
            quantity: disc,
            reason: `Inventaire physique: ${session.name}`,
            reference: session.id,
            created_by: input.userId,
          })
        : await recordStockMovement({
            item_id: line.product_id,
            type: "out",
            quantity: Math.abs(disc),
            reason: `Inventaire physique: ${session.name}`,
            reference: session.id,
            created_by: input.userId,
          });

    if (!movement.success) {
      return {
        success: false,
        error: movement.error ?? `Échec ajustement pour ${line.product_name}.`,
      };
    }
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("inventory_sessions" as never)
    .update({
      status: "validated",
      validated_at: new Date().toISOString(),
      validated_by: input.userId,
    } as never)
    .eq("id", input.sessionId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
