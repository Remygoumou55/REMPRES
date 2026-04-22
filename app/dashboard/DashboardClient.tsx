"use client";

import Link from "next/link";
import type { DashboardKpis } from "@/lib/server/dashboard-kpis";

type DashboardClientProps = {
  email: string | null;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  kpis: DashboardKpis;
};

export function DashboardClient({
  email,
  canReadClients,
  canReadProducts,
  canReadActivityLogs,
  isSuperAdmin = false,
  kpis,
}: DashboardClientProps) {
  return (
    <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-darktext">Dashboard</h1>
      <p className="mt-2 text-sm text-darktext/80">Connecté en tant que : {email ?? "Utilisateur"}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-darktext/70">Clients actifs</p>
          <p className="mt-2 text-2xl font-semibold text-darktext">{kpis.clientsTotal}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-darktext/70">Suppressions clients (24h)</p>
          <p className="mt-2 text-2xl font-semibold text-darktext">{kpis.deletesClientsLast24h}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {canReadClients ? (
          <Link
            href="/vente/clients"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Gérer les clients
          </Link>
        ) : null}
        {canReadProducts ? (
          <Link
            href="/vente/produits"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Gérer les produits
          </Link>
        ) : null}
        {canReadActivityLogs ? (
          <Link
            href="/admin/activity-logs"
            className="inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
          >
            Journal d&apos;activité
          </Link>
        ) : null}
        {isSuperAdmin ? (
          <Link
            href="/admin/users"
            className="inline-block rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary"
          >
            Gestion des utilisateurs
          </Link>
        ) : null}
      </div>
    </div>
  );
}
