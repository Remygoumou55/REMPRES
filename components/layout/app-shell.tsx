"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Menu,
  Package,
  ShoppingCart,
  History,
  Users,
  UserCog,
  ChevronRight,
  ChevronLeft,
  Wallet,
  BarChart3,
  Archive,
  Globe,
  Settings2,
} from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { logError, logInfo } from "@/lib/logger";
import { generateBreadcrumb } from "@/lib/utils/breadcrumb";

// Sub-components & types
import type { ModuleDef, ModuleId } from "./app-shell/types";
import { PrimarySidebar } from "./app-shell/PrimarySidebar";
import { SecondarySidebarPanel } from "./app-shell/SecondarySidebar";
import { MobileSidebar } from "./app-shell/MobileSidebar";

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type AppShellProps = {
  userDisplayName: string;
  userAvatarInitial: string;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  canReadFinance?: boolean;
  children: React.ReactNode;
};

function detectModule(pathname: string): ModuleId {
  if (pathname.startsWith("/vente"))    return "commerce";
  if (pathname.startsWith("/finance"))  return "finance";
  if (pathname.startsWith("/admin"))    return "admin";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

export function AppShell({
  userDisplayName,
  userAvatarInitial,
  canReadClients,
  canReadProducts,
  canReadActivityLogs,
  isSuperAdmin = false,
  canReadFinance = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen,    setIsSidebarOpen]    = useState(true);

  const activeModule = detectModule(pathname);

  const modules: ModuleDef[] = useMemo(() => [
    {
      id: "commerce", label: "Commerce", shortLabel: "Vente",
      icon: ShoppingCart, href: "/vente/clients",
      visible: canReadProducts || canReadClients,
      items: [
        { href: "/vente/clients",        label: "Clients",        icon: Users,        visible: canReadClients  },
        { href: "/vente/produits",        label: "Produits",       icon: Package,      visible: canReadProducts },
        { href: "/vente/nouvelle-vente", label: "Nouvelle vente", icon: ShoppingCart, visible: canReadProducts },
        { href: "/vente/historique",     label: "Historique",     icon: History,      visible: canReadProducts },
      ],
    },
    {
      id: "finance", label: "Finance", shortLabel: "Finance",
      icon: BarChart3, href: "/finance",
      visible: canReadFinance,
      items: [
        { href: "/finance",          label: "Vue d'ensemble", icon: BarChart3, visible: canReadFinance },
        { href: "/finance/depenses", label: "Dépenses",       icon: Wallet,    visible: canReadFinance },
      ],
    },
    {
      id: "admin", label: "Administration", shortLabel: "Admin",
      icon: ClipboardList, href: "/admin/activity-logs",
      visible: canReadActivityLogs,
      items: [
        { href: "/admin/activity-logs", label: "Journal activité", icon: ClipboardList, visible: canReadActivityLogs },
        { href: "/admin/archives",      label: "Archives",         icon: Archive,       visible: isSuperAdmin       },
      ],
    },
    {
      id: "settings", label: "Paramètres", shortLabel: "Config",
      icon: Settings2, href: "/settings",
      visible: true,
      items: [
        { href: "/settings",       label: "Général",        icon: Settings2, visible: true         },
        { href: "/admin/users",    label: "Utilisateurs",   icon: UserCog,   visible: isSuperAdmin },
        { href: "/admin/currency", label: "Taux de change", icon: Globe,     visible: isSuperAdmin },
      ],
    },
  ], [canReadProducts, canReadClients, canReadFinance, canReadActivityLogs, isSuperAdmin]);

  const activeModuleDef = useMemo(() => 
    activeModule !== "dashboard" ? (modules.find((m) => m.id === activeModule) ?? null) : null
  , [activeModule, modules]);

  async function handleLogout() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      logInfo("auth", "logout success", { module: "app-shell" });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      logError("auth", "logout failed", { error, module: "app-shell" });
    }
  }

  const breadcrumbs = useMemo(() => generateBreadcrumb(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-graylight text-darktext">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-primary shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <MobileSidebar
          modules={modules}
          activeModule={activeModule}
          userDisplayName={userDisplayName}
          userAvatarInitial={userAvatarInitial}
          pathname={pathname}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Desktop Primary Sidebar */}
        <aside
          className={`hidden shrink-0 bg-primary transition-all duration-300 ease-in-out md:block ${
            isSidebarOpen ? "w-[72px]" : "w-0 overflow-hidden"
          }`}
        >
          <div className="sticky top-0 h-screen w-[72px]">
            <PrimarySidebar
              modules={modules}
              activeModule={activeModule}
              userAvatarInitial={userAvatarInitial}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
            <div className="flex min-w-0 items-center gap-2 md:flex-1 md:overflow-hidden">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((o) => !o)}
                className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 md:flex"
              >
                {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumb */}
              <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-hidden md:flex">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  const Icon = crumb.icon;
                  return (
                    <span key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1">
                      {index > 0 && <ChevronRight size={14} className="shrink-0 text-gray-300" />}
                      {isLast ? (
                        <span className="inline-flex max-w-[280px] items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-darktext">
                          <Icon size={14} className="shrink-0 opacity-70" />
                          <span className="truncate">{crumb.label}</span>
                        </span>
                      ) : (
                        <Link
                          href={crumb.href}
                          prefetch
                          className="inline-flex max-w-[260px] items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Icon size={14} className="shrink-0 opacity-70" />
                          <span className="truncate">{crumb.label}</span>
                        </Link>
                      )}
                    </span>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Title */}
            <div className="flex items-center gap-2 md:hidden">
              <Image src={getLogoUrl()} alt={appConfig.name} width={24} height={24} className="rounded object-contain" unoptimized />
              <span className="text-sm font-bold text-darktext">{appConfig.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <CurrencySwitcher />
              <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {(userAvatarInitial ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate text-xs font-medium text-gray-700">
                  {userDisplayName}
                </span>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Desktop Secondary Sidebar */}
            {isSidebarOpen && (
              <SecondarySidebarPanel
                module={activeModuleDef}
                pathname={pathname}
              />
            )}

            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
