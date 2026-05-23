"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { logError, logInfo } from "@/lib/logger";
import { ErpNavSidebar } from "./app-shell/ErpNavSidebar";
import { getNavContextLabelFromPath } from "@/lib/constants/nav-context";

type AppShellProps = {
  userDisplayName: string;
  userAvatarInitial: string;
  userRole: string;
  departmentKey: string | null;
  isSuperAdmin?: boolean;
  pendingApprovalsCount?: number;
  children: React.ReactNode;
};

export function AppShell({
  userDisplayName,
  userAvatarInitial,
  userRole,
  departmentKey,
  isSuperAdmin = false,
  pendingApprovalsCount = 0,
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
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      logInfo("auth", "logout success", { module: "app-shell" });
      router.replace("/login");
    } catch (error) {
      logError("auth", "logout failed", { error, module: "app-shell" });
    }
  }, [router]);

  const sidebarProps = {
    userDisplayName,
    userRole,
    pendingApprovalsCount,
    onLogout: handleLogout,
    onCollapsedChange: setSidebarCollapsed,
  };

  const primaryWidthClass = sidebarCollapsed ? "w-[76px]" : "w-[268px]";

  return (
    <div className="min-h-screen bg-graylight text-darktext">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[288px] bg-primary shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ErpNavSidebar {...sidebarProps} />
      </aside>

      <div className="flex min-h-screen">
        <aside
          className={`hidden shrink-0 bg-primary transition-[width] duration-300 ease-in-out md:block ${primaryWidthClass}`}
        >
          <div className={`sticky top-0 h-screen ${primaryWidthClass}`}>
            <ErpNavSidebar {...sidebarProps} />
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

            <div className="flex shrink-0 items-center gap-2">
              <CurrencySwitcher />
              <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {(userAvatarInitial ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate text-xs font-medium text-gray-700">{userDisplayName}</span>
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
