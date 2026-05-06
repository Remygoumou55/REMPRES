"use client";

import { useState, useMemo } from "react";
import { Users, UserPlus } from "lucide-react";
import type { Client } from "@/types/client";
import { QuickClientModal } from "./QuickClientModal";



function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

export function ClientSelector({
  clients,
  selected,
  onSelect,
}: {
  clients: Client[];
  selected: Client | null;
  onSelect: (c: Client | null) => void;
}) {
  const [query, setQuery]         = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // NOTE: In a real perf refactor, I'd use a proper debounced hook.
  // Here I'm just extracting the logic.
  const q = query.trim().toLowerCase();
  
  const filtered = useMemo(() => {
    const list = q
      ? clients.filter((c) => getClientLabel(c).toLowerCase().includes(q))
      : clients;
    return list.slice(0, 400);
  }, [clients, q]);

  function handleCreated(client: Client) {
    onSelect(client);
    setShowModal(false);
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Users size={11} />
            Client <span className="text-red-500">*</span>
          </label>
          {selected && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="shrink-0 text-[10px] font-semibold text-gray-400 underline-offset-2 hover:text-primary hover:underline"
            >
              Effacer
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.06] px-3 py-2.5 text-sm font-bold text-primary shadow-sm transition hover:border-primary hover:bg-primary/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <UserPlus size={16} strokeWidth={2.25} />
          Nouveau client
        </button>

        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer la liste…"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            aria-label="Filtrer les clients"
          />
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Clients enregistrés — faire défiler horizontalement
          </p>
          <div
            className="max-w-full overflow-x-scroll overflow-y-hidden rounded-xl border border-gray-100 bg-gray-50/80 py-2 pl-2 pr-1 [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-400/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-200"
            role="listbox"
            aria-label="Liste des clients"
          >
            <div className="flex w-max min-w-full flex-nowrap gap-2 pb-0.5">
              {filtered.map((c) => {
                const isSel = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onClick={() => onSelect(isSel ? null : c)}
                    className={`flex max-w-[11rem] shrink-0 flex-col items-start rounded-xl border px-2.5 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                      isSel
                        ? "border-primary bg-primary text-white shadow-md ring-1 ring-primary/20"
                        : "border-gray-200 bg-white text-darktext hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <span className={`line-clamp-2 font-semibold ${isSel ? "text-white" : "text-darktext"}`}>
                      {getClientLabel(c)}
                    </span>
                    {c.phone ? (
                      <span className={`mt-0.5 truncate font-mono text-[10px] ${isSel ? "text-white/85" : "text-gray-500"}`}>
                        {c.phone}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-xs text-gray-400">Aucun client ne correspond.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuickClientModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
