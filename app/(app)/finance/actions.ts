"use server";

import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  getMonthlyReportData,
  type MonthlyReportData,
} from "@/lib/server/finance-monthly-report";
import { getCachedProfileRow } from "@/lib/server/profile-row";

export async function getMonthlyReportAction(
  month: number,
  year: number,
): Promise<{
  success: boolean;
  data?: MonthlyReportData;
  error?: string;
}> {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { success: false, error: "Mois invalide." };
  }
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { success: false, error: "Année invalide." };
  }

  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  try {
    const profile = await getCachedProfileRow(user.id);
    const name = profile.displayName || "Responsable Finance";
    const data = await getMonthlyReportData(month, year, name);
    return { success: true, data };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la génération du bilan.";
    return { success: false, error: message };
  }
}
