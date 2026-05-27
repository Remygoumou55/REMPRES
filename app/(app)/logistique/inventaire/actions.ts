"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import {
  completeInventorySession,
  createInventorySession,
  getInventoryLines,
  getInventorySession,
  startInventorySession,
  updateInventoryLine,
  validateInventorySession,
} from "@/lib/server/inventory";
import type { InventoryLine, InventorySession } from "@/lib/server/inventory";

export async function createInventorySessionAction(
  formData: FormData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const result = await createInventorySession({
    name,
    notes: notes || undefined,
    userId: user.id,
  });

  if (result.success) {
    revalidatePath("/logistique/inventaire");
  }
  return result;
}

export async function startSessionAction(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await startInventorySession(sessionId);
  if (result.success) {
    revalidatePath("/logistique/inventaire");
    revalidatePath(`/logistique/inventaire/${sessionId}`);
  }
  return result;
}

export async function updateLineAction(
  lineId: string,
  countedQuantity: number,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  return updateInventoryLine({
    lineId,
    countedQuantity,
    notes,
    userId: user.id,
  });
}

export async function completeSessionAction(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await completeInventorySession(sessionId);
  if (result.success) {
    revalidatePath("/logistique/inventaire");
    revalidatePath(`/logistique/inventaire/${sessionId}`);
  }
  return result;
}

export async function validateSessionAction(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertLogistiqueWrite(user.id);

  const result = await validateInventorySession({
    sessionId,
    userId: user.id,
  });

  if (result.success) {
    revalidatePath("/logistique/inventaire");
    revalidatePath(`/logistique/inventaire/${sessionId}`);
    revalidatePath("/logistique/articles");
    revalidatePath("/logistique/mouvements");
    revalidatePath("/logistique/stock");
  }
  return result;
}

export async function fetchInventoryReportDataAction(
  sessionId: string,
): Promise<{
  session: InventorySession | null;
  lines: InventoryLine[];
}> {
  const user = await getServerSessionUser();
  if (!user) return { session: null, lines: [] };

  const [session, lines] = await Promise.all([
    getInventorySession(sessionId),
    getInventoryLines(sessionId),
  ]);
  return { session, lines };
}
