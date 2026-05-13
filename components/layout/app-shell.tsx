"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Menu,
  Package,
  ShoppingCart,
  History,
  Users,
  BarChart3,
  Settings2,
  Truck,
  UsersRound,
  Zap,
  Shield,
  Receipt,
  LayoutDashboard,
  FileText,
  UserPlus,
  Clock,
  Calendar,
  Archive,
} from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { logError, logInfo } from "@/lib/logger";
import { useTranslation } from "@/hooks/use-translation";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { ROUTES } from "@/lib/constants/routes";
import { useActiveNav } from "./app-shell/useActiveNav";
import { CRM_NAV } from "@/modules/crm/constants/nav";
import { LOGISTICS_NAV } from "@/modules/logistics/constants/nav";

import type { ModuleDef } from "./app-shell/types";
import { PrimarySidebar } from "./app-shell/PrimarySidebar";
import { SecondarySidebarPanel } from "./app-shell/SecondarySidebar";
import { MobileSidebar } from "./app-shell/MobileSidebar";

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

const RH_NAV_ITEMS = [
  { href: ROUTES.rh, label: "Pilotage RH", icon: LayoutDashboard },
  { href: `${ROUTES.rh}/collaborateurs`, label: "Collaborateurs", icon: Users },
  { href: `${ROUTES.rh}/contrats`, label: "Contrats", icon: FileText },
  { href: `${ROUTES.rh}/recrutement`, label: "Recrutement", icon: UserPlus },
  { href: `${ROUTES.rh}/presences`, label: "Présences", icon: Clock },
  { href: `${ROUTES.rh}/conges`, label: "Congés", icon: Calendar },
  { href: ROUTES.rhVisual, label: "Analytique", icon: BarChart3 },
] as const;

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
  const router = useRouter();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrimaryExpanded, setIsPrimaryExpanded] = useState(true);

  const activeModule = useActiveNav();

  const modules: ModuleDef[] = useMemo(() => {
    const crmVisible = canReadClients || canReadProducts;
    const commerceVisible = canReadClients || canReadProducts;

    return [
      {
        id: "commerce",
        label: NAV_LABELS.commerce,
        shortLabel: NAV_LABELS.commerce,
        icon: ShoppingCart,
        href: ROUTES.clients,
        visible: commerceVisible,
        items: [
          { href: ROUTES.clients, label: t("navigation.item.clients"), icon: Users, visible: canReadClients, section: "COMMERCE" },
          { href: ROUTES.produits, label: t("navigation.item.products"), icon: Package, visible: canReadProducts, section: "COMMERCE" },
          { href: ROUTES.newSale, label: t("navigation.item.newSale"), icon: ShoppingCart, visible: canReadProducts, section: "COMMERCE" },
          { href: ROUTES.history, label: t("navigation.item.history"), icon: History, visible: canReadProducts, section: "COMMERCE" },
        ],
      },
      {
        id: "crm",
        label: NAV_LABELS.crm,
        shortLabel: NAV_LABELS.crm,
        icon: BriefcaseBusiness,
        href: ROUTES.crm,
        visible: crmVisible,
        items: CRM_NAV.map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon,
          visible: true,
          section: "CRM",
        })),
      },
      {
        id: "finance",
        label: t("navigation.module.finance"),
        shortLabel: t("navigation.short.finance"),
        icon: BarChart3,
        href: ROUTES.finance,
        visible: canReadFinance,
        items: [
          { href: ROUTES.finance, label: t("navigation.item.financeOverview"), icon: BarChart3, visible: canReadFinance, section: "FINANCE" },
          { href: ROUTES.depenses, label: t("navigation.item.expenses"), icon: Receipt, visible: canReadFinance, section: "FINANCE" },
        ],
      },
      {
        id: "rh",
        label: NAV_LABELS.rh,
        shortLabel: "RH",
        icon: UsersRound,
        href: ROUTES.rh,
        visible: true,
        items: RH_NAV_ITEMS.map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon,
          visible: true,
          section: "RH",
        })),
      },
      {
        id: "logistics",
        label: NAV_LABELS.logistics,
        shortLabel: "Logist.",
        icon: Truck,
        href: ROUTES.logistics,
        visible: true,
        items: LOGISTICS_NAV.map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon,
          visible: true,
          section: "LOGISTIQUE",
        })),
      },
      {
        id: "actions",
        label: NAV_LABELS.actions,
        shortLabel: NAV_LABELS.actions,
        icon: Zap,
        href: ROUTES.actions,
        visible: canReadActivityLogs || isSuperAdmin,
        items: [{ href: ROUTES.actions, label: NAV_LABELS.actions, icon: Zap, visible: canReadActivityLogs || isSuperAdmin, section: "OPERATIONS" }],
      },
      {
        id: "admin",
        label: NAV_LABELS.admin,
        shortLabel: NAV_LABELS.admin,
        icon: Shield,
        href: ROUTES.admin,
        visible: canReadActivityLogs || isSuperAdmin,
        items: [
          { href: ROUTES.admin, label: "Console administration", icon: Shield, visible: canReadActivityLogs || isSuperAdmin, section: "ADMINISTRATION" },
          { href: ROUTES.archives, label: NAV_LABELS.archives, icon: Archive, visible: isSuperAdmin, section: "ADMINISTRATION" },
          { href: ROUTES.config, label: NAV_LABELS.config, icon: Settings2, visible: canReadActivityLogs || isSuperAdmin, section: "ADMINISTRATION" },
        ],
      },
    ];
  }, [canReadProducts, canReadClients, canReadFinance, canReadActivityLogs, isSuperAdmin, t]);

  const activeModuleDef = useMemo(
    () => (activeModule !== "dashboard" && activeModule !== "settings" ? (modules.find((m) => m.id === activeModule) ?? null) : null),
    [activeModule, modules],
  );

  const navContextLabel = useMemo(() => {
    if (pathname.startsWith("/settings")) return NAV_LABELS.settings;
    if (pathname.startsWith("/dept")) return NAV_LABELS.dept;
    if (activeModule === "dashboard") return NAV_LABELS.home;
    const mod = modules.find((m) => m.id === activeModule && m.visible);
    return mod?.label ?? "";
  }, [pathname, activeModule, modules]);

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

  const primaryWidthClass = isPrimaryExpanded ? "w-[268px]" : "w-[76px]";

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

      <div className="flex min-h-screen">
        <aside className={`hidden shrink-0 bg-primary transition-[width] duration-300 ease-in-out md:block ${primaryWidthClass}`}>
          <div className={`sticky top-0 h-screen ${primaryWidthClass}`}>
            <PrimarySidebar
              modules={modules}
              activeModule={activeModule}
              userAvatarInitial={userAvatarInitial}
              onLogout={handleLogout}
              isExpanded={isPrimaryExpanded}
              onToggleExpanded={() => setIsPrimaryExpanded((e) => !e)}
            />
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
              <p className="hidden min-w-0 truncate text-sm font-medium text-gray-600 sm:block">{navContextLabel}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:hidden">
              <Image src={getLogoUrl()} alt={appConfig.name} width={24} height={24} className="rounded object-contain" unoptimized />
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

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <SecondarySidebarPanel module={activeModuleDef} pathname={pathname} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
