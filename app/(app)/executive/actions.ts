"use server";

import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  getWeeklyReportData,
  type WeeklyReportData,
} from "@/lib/server/executive-weekly-report";
import { getCachedProfileRow } from "@/lib/server/profile-row";

export async function getWeeklyReportAction(
  weekNumber: number,
  year: number,
): Promise<{
  success: boolean;
  data?: WeeklyReportData;
  error?: string;
}> {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 53) {
    return { success: false, error: "Paramètres invalides." };
  }
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    return { success: false, error: "Paramètres invalides." };
  }

  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  try {
    const profile = await getCachedProfileRow(user.id);
    const name = profile.displayName || "Direction Générale";
    const data = await getWeeklyReportData(weekNumber, year, name);
    return { success: true, data };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors de la génération du rapport.";
    return { success: false, error: message };
  }
}
