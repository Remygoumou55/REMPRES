"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Menu,
  Package,
  LayoutDashboard,
  Bell,
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
  Building2,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Megaphone,
  Truck,
} from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { logError, logInfo } from "@/lib/logger";
import { generateBreadcrumb } from "@/lib/utils/breadcrumb";
import { getSuperAdminSidebarItems } from "@/lib/governance/sidebar-config";
import { scopeModulesToCurrentDepartment } from "@/lib/departments/sidebar-scope";
import { useTranslation } from "@/hooks/use-translation";

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
  if (pathname.startsWith("/admin/global-dashboard")) return "governance";
  if (pathname.startsWith("/admin/intelligence")) return "governance";
  if (pathname.startsWith("/admin/alerts")) return "governance";
  if (pathname.startsWith("/admin/approvals")) return "governance";
  if (pathname.startsWith("/admin/activity-logs")) return "governance";
  if (pathname.startsWith("/admin/departments")) return "departments";
  if (pathname.startsWith("/vente"))    return "commerce";
  if (pathname.startsWith("/finance"))  return "finance";
  if (pathname.startsWith("/admin"))    return "admin";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

const BREADCRUMB_TRANSLATION_KEYS: Record<string, string> = {
  Accueil: "navigation.breadcrumb.home",
  "Tableau de bord": "navigation.breadcrumb.dashboard",
  Administration: "navigation.module.admin",
  Approbations: "navigation.item.approvals",
  Alertes: "navigation.item.alerts",
  Audit: "navigation.item.audit",
  Intelligence: "navigation.item.intelligence",
  Parametres: "navigation.module.settings",
  Finance: "navigation.module.finance",
  Clients: "navigation.item.clients",
  Produits: "navigation.item.products",
  Historique: "navigation.item.history",
  Utilisateurs: "navigation.item.users",
  Archives: "navigation.item.archives",
};

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
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen,    setIsSidebarOpen]    = useState(true);

  const activeModule = detectModule(pathname);

  const modulesRaw: ModuleDef[] = useMemo(() => {
    if (isSuperAdmin) {
      const iconMap = {
        LayoutDashboard,
        BarChart3,
        ClipboardList,
        UserCog,
        Archive,
        Settings2,
        ShoppingCart,
        Wallet,
        Users,
        GraduationCap,
        Headphones,
        Megaphone,
        Truck,
        Building2,
        Bell,
        CheckCircle2,
      } as const;

      const configItems = getSuperAdminSidebarItems().map((item) => ({
        href: item.href,
        label: t(`navigation.superadmin.${item.href}`),
        icon: iconMap[item.iconKey as keyof typeof iconMap] ?? Building2,
        visible: true,
        section:
          item.section === "enterprise_governance"
            ? t("navigation.section.enterpriseGovernance")
            : item.section === "department_supervision"
              ? t("navigation.section.departmentSupervision")
              : t("navigation.section.administration"),
      }));

      return [
        {
          id: "governance",
          label: t("navigation.module.governance"),
          shortLabel: t("navigation.short.governance"),
          icon: ClipboardList,
          href: "/admin/global-dashboard",
          visible: true,
          items: configItems.filter((item) => item.section === t("navigation.section.enterpriseGovernance")),
        },
        {
          id: "departments",
          label: t("navigation.module.supervision"),
          shortLabel: t("navigation.short.supervision"),
          icon: Building2,
          href: "/admin/departments/vente",
          visible: true,
          items: configItems.filter((item) => item.section === t("navigation.section.departmentSupervision")),
        },
        {
          id: "admin",
          label: t("navigation.module.admin"),
          shortLabel: t("navigation.short.admin"),
          icon: UserCog,
          href: "/admin/users",
          visible: true,
          items: configItems.filter((item) => item.section === t("navigation.section.administration")),
        },
        {
          id: "settings",
          label: t("navigation.module.settings"),
          shortLabel: t("navigation.short.settings"),
          icon: Settings2,
          href: "/settings",
          visible: true,
          items: [{ href: "/settings", label: t("navigation.item.settingsGeneral"), icon: Settings2, visible: true }],
        },
      ];
    }

    return [
      {
        id: "commerce", label: t("navigation.module.commerce"), shortLabel: t("navigation.short.commerce"),
        icon: ShoppingCart, href: "/vente/clients",
        visible: canReadProducts || canReadClients,
        items: [
          { href: "/vente/clients", label: t("navigation.item.clients"), icon: Users, visible: canReadClients },
          { href: "/vente/produits", label: t("navigation.item.products"), icon: Package, visible: canReadProducts },
          { href: "/vente/nouvelle-vente", label: t("navigation.item.newSale"), icon: ShoppingCart, visible: canReadProducts },
          { href: "/vente/historique", label: t("navigation.item.history"), icon: History, visible: canReadProducts },
        ],
      },
      {
        id: "finance", label: t("navigation.module.finance"), shortLabel: t("navigation.short.finance"),
        icon: BarChart3, href: "/finance",
        visible: canReadFinance,
        items: [
          { href: "/finance", label: t("navigation.item.financeOverview"), icon: BarChart3, visible: canReadFinance },
          { href: "/finance/depenses", label: t("navigation.item.expenses"), icon: Wallet, visible: canReadFinance },
        ],
      },
      {
        id: "admin", label: t("navigation.module.admin"), shortLabel: t("navigation.short.admin"),
        icon: ClipboardList, href: "/admin/activity-logs",
        visible: canReadActivityLogs,
        items: [
          { href: "/admin/activity-logs", label: t("navigation.item.activityLog"), icon: ClipboardList, visible: canReadActivityLogs },
          { href: "/admin/archives", label: t("navigation.item.archives"), icon: Archive, visible: false },
        ],
      },
      {
        id: "settings", label: t("navigation.module.settings"), shortLabel: t("navigation.short.settings"),
        icon: Settings2, href: "/settings",
        visible: true,
        items: [
          { href: "/settings", label: t("navigation.item.settingsGeneral"), icon: Settings2, visible: true },
          { href: "/admin/users", label: t("navigation.item.users"), icon: UserCog, visible: false },
          { href: "/admin/currency", label: t("navigation.item.currency"), icon: Globe, visible: false },
        ],
      },
    ];
  }, [canReadProducts, canReadClients, canReadFinance, canReadActivityLogs, isSuperAdmin, t]);

  const modules = useMemo(
    () => scopeModulesToCurrentDepartment(modulesRaw, pathname, isSuperAdmin),
    [modulesRaw, pathname, isSuperAdmin],
  );

  const activeModuleDef = useMemo(
    () => (activeModule !== "dashboard" ? (modules.find((m) => m.id === activeModule) ?? null) : null),
    [activeModule, modules],
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

  const breadcrumbs = useMemo(
    () =>
      generateBreadcrumb(pathname).map((crumb) => ({
        ...crumb,
        label: t(BREADCRUMB_TRANSLATION_KEYS[crumb.label] ?? crumb.label),
      })),
    [pathname, t],
  );

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
