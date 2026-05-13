"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";

type HistoriqueSalesFiltersFormProps = {
  initialClient: string;
  initialStatus: string;
  initialFrom: string;
  initialTo: string;
};

/**
 * Filtres historique ventes — soumission React (`onSubmit` + `router.push`),
 * sans formulaire GET natif ni accès DOM.
 */
export function HistoriqueSalesFiltersForm({
  initialClient,
  initialStatus,
  initialFrom,
  initialTo,
}: HistoriqueSalesFiltersFormProps) {
  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  useEffect(() => {
    setClient(initialClient);
    setStatus(initialStatus);
    setFrom(initialFrom);
    setTo(initialTo);
  }, [initialClient, initialStatus, initialFrom, initialTo]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    const c = client.trim();
    if (c) params.set("client", c);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", "1");
    const qs = params.toString();
    router.push(qs ? `/vente/historique?${qs}` : "/vente/historique");
  }

  const hasFilters = !!(status || from || to || client.trim());

  return (
    <form onSubmit={handleSubmit}>
      <FilterPanelShell>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Nom du client…"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Filtrer par nom de client"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Statut de paiement"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulé</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Date de début"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Date de fin"
          />

          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            Filtrer
          </button>
        </div>

      {hasFilters ? (
        <div className="mt-2">
          <Link href="/vente/historique" className="text-xs text-gray-400 hover:text-gray-600">
            Réinitialiser les filtres
          </Link>
        </div>
      ) : null}
      </FilterPanelShell>
    </form>
  );
}
