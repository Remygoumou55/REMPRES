"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  getReconciliationById,
  updateBankBalance,
  validateReconciliation,
  type BankReconciliation,
} from "@/lib/server/bank-reconciliation";
import { getCachedProfileRow } from "@/lib/server/profile-row";

export async function saveBankBalanceAction(
  reconciliationId: string,
  bankBalance: number,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  if (!Number.isFinite(bankBalance) || bankBalance < 0) {
    return { success: false, error: "Le solde bancaire doit être ≥ 0." };
  }

  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await updateBankBalance({
    id: reconciliationId,
    bank_balance_gnf: Math.round(bankBalance),
    notes,
  });

  if (result.success) {
    revalidatePath("/finance/rapprochement");
    revalidatePath("/finance");
  }

  return result;
}

export async function validateReconciliationAction(
  reconciliationId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await validateReconciliation({
    id: reconciliationId,
    userId: user.id,
  });

  if (result.success) {
    revalidatePath("/finance/rapprochement");
    revalidatePath("/finance");
  }

  return result;
}

export async function getReconciliationForPDFAction(
  reconciliationId: string,
): Promise<{
  success: boolean;
  data?: BankReconciliation;
  userName?: string;
  error?: string;
}> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const rec = await getReconciliationById(reconciliationId);
  if (!rec) return { success: false, error: "Rapprochement introuvable." };
  if (rec.bank_balance_gnf == null) {
    return { success: false, error: "Solde bancaire non renseigné." };
  }

  const profile = await getCachedProfileRow(user.id);
  return {
    success: true,
    data: rec,
    userName: profile.displayName || "Responsable Finance",
  };
}
