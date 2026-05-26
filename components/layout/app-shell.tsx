"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { logError, logInfo } from "@/lib/logger";
import { getNavContextLabelFromPath } from "@/lib/constants/nav-context";
import {
  getSidebarForRole,
  usesErpGlobalSidebar,
} from "@/lib/navigation/sidebar-for-role";
import type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";
import { AvatarDropdown } from "@/components/ui/AvatarDropdown";
import { NotificationBell } from "@/components/ui/NotificationBell";

const EMPTY_SHELL_RAIL: ShellRailVisibility = {
  commerce: false,
  crm: false,
  finance: false,
  rh: false,
  logistics: false,
  formation: false,
  marketing: false,
  actions: false,
  settings: false,
};

function SidebarLoadingPlaceholder() {
  return <div className="h-full w-full bg-primary" aria-hidden />;
}

const ErpNavSidebar = dynamic(
  () => import("./app-shell/ErpNavSidebar").then((m) => ({ default: m.ErpNavSidebar })),
  { loading: SidebarLoadingPlaceholder },
);

const DepartmentBusinessSidebar = dynamic(
  () =>
    import("./app-shell/DepartmentBusinessSidebar").then((m) => ({
      default: m.DepartmentBusinessSidebar,
    })),
  { loading: SidebarLoadingPlaceholder },
);

const CurrencySwitcher = dynamic(
  () => import("@/components/CurrencySwitcher").then((m) => ({ default: m.CurrencySwitcher })),
  {
    ssr: false,
    loading: () => <div className="h-8 w-24 rounded-full bg-gray-100" aria-hidden />,
  },
);

type AppShellProps = {
  userDisplayName: string;
  userAvatarInitial: string;
  userAvatarUrl?: string | null;
  userEmail?: string | null;
  userRole: string;
  departmentKey: string | null;
  isSuperAdmin?: boolean;
  userId?: string | null;
  pendingApprovalsCount?: number;
  shellRail?: ShellRailVisibility;
  canReadClients?: boolean;
  canReadProducts?: boolean;
  children: React.ReactNode;
};

export function AppShell({
  userDisplayName,
  userAvatarInitial,
  userAvatarUrl = null,
  userEmail = null,
  userRole,
  departmentKey,
  isSuperAdmin = false,
  userId = null,
  pendingApprovalsCount = 0,
  shellRail,
  canReadClients = false,
  canReadProducts = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navContextLabel = useMemo(
    () => getNavContextLabelFromPath(pathname ?? "", departmentKey, isSuperAdmin),
    [pathname, departmentKey, isSuperAdmin],
  );

  const handleLogout = useCallback(async () => {
    try {
      document.cookie = "rempres_role=; path=/; max-age=0; SameSite=Lax";
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      logInfo("auth", "logout success", { module: "app-shell" });
      router.replace("/login");
    } catch (error) {
      logError("auth", "logout failed", { error, module: "app-shell" });
    }
  }, [router]);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const sidebarProps = useMemo(
    () => ({
      userDisplayName,
      userRole,
      pendingApprovalsCount,
      onLogout: handleLogout,
      onCollapsedChange: setSidebarCollapsed,
    }),
    [userDisplayName, userRole, pendingApprovalsCount, handleLogout],
  );

  const sidebarResolution = useMemo(
    () =>
      getSidebarForRole({
        isSuperAdmin,
        roleKey: userRole,
        departmentKey,
      }),
    [isSuperAdmin, userRole, departmentKey],
  );

  const railForDept = useMemo(() => shellRail ?? EMPTY_SHELL_RAIL, [shellRail]);

  const toggleSidebarExpanded = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const sidebarContent = useMemo(() => {
    if (usesErpGlobalSidebar(sidebarResolution.mode)) {
      return <ErpNavSidebar {...sidebarProps} />;
    }

    return (
      <DepartmentBusinessSidebar
        pathname={pathname ?? ""}
        departmentKey={sidebarResolution.departmentKey ?? departmentKey}
        shellRail={railForDept}
        canReadClients={canReadClients}
        canReadProducts={canReadProducts}
        userAvatarInitial={userAvatarInitial}
        userDisplayName={userDisplayName}
        onLogout={handleLogout}
        isExpanded={!sidebarCollapsed}
        onToggleExpanded={toggleSidebarExpanded}
      />
    );
  }, [
    sidebarResolution,
    sidebarProps,
    pathname,
    departmentKey,
    railForDept,
    canReadClients,
    canReadProducts,
    userAvatarInitial,
    userDisplayName,
    handleLogout,
    sidebarCollapsed,
    toggleSidebarExpanded,
  ]);

  const primaryWidthClass = sidebarCollapsed ? "w-[76px]" : "w-[268px]";

  return (
    <div className="min-h-screen bg-graylight text-darktext">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[288px] bg-primary shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {isMobileMenuOpen ? sidebarContent : null}
      </aside>

      <div className="flex min-h-screen">
        <aside
          className={`hidden shrink-0 bg-primary transition-[width] duration-300 ease-in-out md:block ${primaryWidthClass}`}
        >
          <div className={`sticky top-0 h-screen ${primaryWidthClass}`}>
            {sidebarContent}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 shadow-sm">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu size={20} />
              </button>
              <p className="hidden min-w-0 truncate text-sm font-medium text-gray-600 sm:block">
                {navContextLabel}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <Image
                src={getLogoUrl()}
                alt={appConfig.name}
                width={24}
                height={24}
                className="rounded object-contain"
                unoptimized
              />
              <span className="max-w-[120px] truncate text-sm font-bold text-darktext">{appConfig.name}</span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <CurrencySwitcher />
              <NotificationBell
                userId={userId}
                role={userRole}
                initialUnreadCount={pendingApprovalsCount}
              />
              <AvatarDropdown
                name={userDisplayName}
                email={userEmail}
                role={userRole}
                avatarUrl={userAvatarUrl}
              />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
