"use client";

import { ClientsTable } from "@/components/vente/clients/clients-table";
import { useClientsRealtime } from "@/components/vente/clients/ClientsRealtimeProvider";

type Props = {
  canUpdate?: boolean;
  canDelete?: boolean;
  listQueryString: string;
};

export function ClientsTableLive({ canUpdate, canDelete, listQueryString }: Props) {
  const { clients } = useClientsRealtime();
  return (
    <ClientsTable
      clients={clients}
      canUpdate={canUpdate}
      canDelete={canDelete}
      listQueryString={listQueryString}
    />
  );
}
