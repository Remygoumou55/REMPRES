import { AppShell } from "@/components/layout/app-shell";
import { getLayoutAccess } from "@/lib/server/layout-access";

export default async function VenteLayout({ children }: { children: React.ReactNode }) {
  const access = await getLayoutAccess();

  return (
    <AppShell
      email={access.email}
      canReadClients={access.canReadClients}
      canReadProducts={access.canReadProducts}
      canReadActivityLogs={access.canReadActivityLogs}
      isSuperAdmin={access.isSuperAdmin}
      canReadFinance={access.canReadFinance}
    >
      {children}
    </AppShell>
  );
}
