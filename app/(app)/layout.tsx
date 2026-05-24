import { AppShell } from "@/components/layout/app-shell";
import { getLayoutAccess } from "@/lib/server/layout-access";
import { Providers } from "@/app/providers";
import { loadShellLocaleMessages } from "@/lib/i18n/load-messages";

/**
 * Coque ERP unique pour tout le périmètre métier : le layout ne se démonte plus
 * quand on passe de /dashboard à /vente à /finance, ce qui rend la navigation
 * entre modules et onglets beaucoup plus réactive (plus de double AppShell).
 */
export default async function AppRouteLayout({ children }: { children: React.ReactNode }) {
  const access = await getLayoutAccess();
  const { locale, messages } = await loadShellLocaleMessages(access.preferredLanguage);

  return (
    <Providers locale={locale} messages={messages}>
      <AppShell
        userDisplayName={access.userDisplayName}
        userAvatarInitial={access.userAvatarInitial}
        userRole={access.roleKey ?? ""}
        departmentKey={access.departmentKey}
        isSuperAdmin={access.isSuperAdmin}
        pendingApprovalsCount={access.pendingApprovalsCount}
        shellRail={access.shellRail}
        canReadClients={access.canReadClients}
        canReadProducts={access.canReadProducts}
      >
        {children}
      </AppShell>
    </Providers>
  );
}
