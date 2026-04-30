import { AppShell } from "@/components/layout/app-shell";
import { getLayoutAccess } from "@/lib/server/layout-access";

/**
 * Coque ERP unique pour tout le périmètre métier : le layout ne se démonte plus
 * quand on passe de /dashboard à /vente à /finance, ce qui rend la navigation
 * entre modules et onglets beaucoup plus réactive (plus de double AppShell).
 */
export default async function AppRouteLayout({ children }: { children: React.ReactNode }) {
  const access = await getLayoutAccess();

  return (
    <AppShell
      userDisplayName={access.userDisplayName}
      userAvatarInitial={access.userAvatarInitial}
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
