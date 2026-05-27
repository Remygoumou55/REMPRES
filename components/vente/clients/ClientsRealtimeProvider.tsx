"use client";

import { createContext, useContext, useMemo } from "react";
import type { Client } from "@/types/client";
import { useRealtimeList } from "@/hooks/useRealtimeList";
import { RealtimeLiveBadge } from "@/components/ui/RealtimeLiveBadge";

type ClientsRealtimeContextValue = {
  clients: Client[];
  isLive: boolean;
};

const ClientsRealtimeContext = createContext<ClientsRealtimeContextValue | null>(
  null,
);

export function useClientsRealtime(): ClientsRealtimeContextValue {
  const ctx = useContext(ClientsRealtimeContext);
  if (!ctx) {
    throw new Error("useClientsRealtime must be used within ClientsRealtimeProvider");
  }
  return ctx;
}

export function ClientsRealtimeProvider({
  initialClients,
  children,
}: {
  initialClients: Client[];
  children: React.ReactNode;
}) {
  const { data, isLive } = useRealtimeList<Client>({
    table: "clients",
    initialData: initialClients,
    mode: "optimistic",
  });

  const value = useMemo(
    () => ({ clients: data, isLive }),
    [data, isLive],
  );

  return (
    <ClientsRealtimeContext.Provider value={value}>
      {children}
    </ClientsRealtimeContext.Provider>
  );
}

export function ClientsRealtimeSubtitle({ total }: { total: number }) {
  const { isLive } = useClientsRealtime();
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>
        {total} client{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}.
      </span>
      {isLive ? <RealtimeLiveBadge /> : null}
    </span>
  );
}
