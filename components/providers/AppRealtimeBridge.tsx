"use client";

import { useAppRealtimeSync } from "@/lib/realtime/use-app-realtime-sync";

/**
 * Pont realtime ERP — monté une fois dans `Providers`.
 * Met à jour KPIs, tableaux de bord et listes sans rechargement manuel.
 */
export function AppRealtimeBridge() {
  useAppRealtimeSync();
  return null;
}
