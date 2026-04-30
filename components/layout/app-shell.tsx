"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  History,
  Users,
  UserCog,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Wallet,
  BarChart3,
  Archive,
  Globe,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModuleId = "dashboard" | "commerce" | "finance" | "admin" | "settings";

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

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
};

type ModuleDef = {
  id: ModuleId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  href: string;
  visible: boolean;
  items: NavItem[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectModule(pathname: string): ModuleId {
  if (pathname.startsWith("/vente"))    return "commerce";
  if (pathname.startsWith("/finance"))  return "finance";
  if (pathname.startsWith("/admin"))    return "admin";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/finance") return pathname === "/finance";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UserAvatar({ initial }: { initial: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
      {(initial ?? "U").charAt(0).toUpperCase()}
    </div>
  );
}

const MODULE_LABELS: Record<ModuleId, string> = {
  dashboard: "Tableau de bord",
  commerce:  "Commerce",
  finance:   "Finance",
  admin:     "Administration",
  settings:  "Paramètres",
};

// ---------------------------------------------------------------------------
// PRIMARY SIDEBAR — icônes uniquement (72 px)
// ---------------------------------------------------------------------------

function PrimarySidebar({
  modules,
  activeModule,
  userAvatarInitial,
  onLogout,
  prefetchHref,
}: {
  modules: ModuleDef[];
  activeModule: ModuleId;
  userAvatarInitial: string;
  onLogout: () => void;
  prefetchHref: (href: string) => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center">

      {/* Logo */}
      <div className="flex shrink-0 items-center justify-center py-5">
        <Image
          src={getLogoUrl()}
          alt={appConfig.name}
          width={36}
          height={36}
          className="rounded-xl object-contain"
          unoptimized
        />
      </div>

      {/* Tableau de bord */}
      <div className="w-full shrink-0 px-2 pb-3">
        <Link
          href="/dashboard"
          prefetch
          title="Tableau de bord"
          onPointerEnter={() => prefetchHref("/dashboard")}
          className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-all ${
            activeModule === "dashboard"
              ? "bg-white/20 text-white shadow-sm"
              : "text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[8px] font-bold uppercase tracking-wide leading-none">Accueil</span>
        </Link>
      </div>

      {/* Séparateur */}
      <div className="mx-auto mb-3 h-px w-10 bg-white/15" />

      {/* Modules */}
      <nav className="flex w-full flex-1 flex-col gap-1 overflow-y-auto px-2">
        {modules
          .filter((m) => m.visible)
          .map((m) => {
            const isActive = activeModule === m.id;
            const Icon = m.icon;
            return (
              <Link
                key={m.id}
                href={m.href}
                prefetch
                title={m.label}
                onPointerEnter={() => prefetchHref(m.href)}
                className={`group flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-3 transition-all ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/45 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <Icon size={19} />
                <span className="text-center text-[8px] font-bold uppercase tracking-wide leading-none">
                  {m.shortLabel}
                </span>
              </Link>
            );
          })}
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar initial={userAvatarInitial} />
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SECONDARY SIDEBAR — carte flottante (positionnée SOUS la topbar)
// ---------------------------------------------------------------------------

function SecondarySidebarPanel({
  module,
  pathname,
  prefetchHref,
}: {
  module: ModuleDef | null;
  pathname: string;
  prefetchHref: (href: string) => void;
}) {
  if (!module) return null;

  const visibleItems = module.items.filter((i) => i.visible);
  if (visibleItems.length === 0) return null;

  const ModuleIcon = module.icon;

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col overflow-hidden border-r border-gray-200/60 bg-gray-50/40 md:flex">
      {/* Padding interne — donne l'effet "carte flottante" */}
      <div className="flex flex-1 flex-col p-3 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">

          {/* En-tête du panneau */}
          <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-4 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <ModuleIcon size={13} className="text-primary" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
              {module.label}
            </h2>
          </div>

          {/* Liens */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = isNavItemActive(item.href, pathname);
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    onPointerEnter={() => prefetchHref(item.href)}
                    className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-darktext"
                    }`}
                  >
                    <ItemIcon
                      size={15}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
                      }`}
                    />
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={12} className="shrink-0 text-white/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// MOBILE SIDEBAR — unifié (primary + secondary)
// ---------------------------------------------------------------------------

function MobileSidebar({
  modules,
  activeModule,
  userDisplayName,
  userAvatarInitial,
  pathname,
  onClose,
  onLogout,
  prefetchHref,
}: {
  modules: ModuleDef[];
  activeModule: ModuleId;
  userDisplayName: string;
  userAvatarInitial: string;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
  prefetchHref: (href: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">

      {/* Logo + fermer */}
      <div className="flex shrink-0 items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={getLogoUrl()}
            alt={appConfig.name}
            width={32}
            height={32}
            className="rounded-xl object-contain"
            unoptimized
          />
          <div>
            <p className="text-sm font-bold text-white">{appConfig.name}</p>
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/50">ERP</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Dashboard */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard"
          prefetch
          onPointerEnter={() => prefetchHref("/dashboard")}
          onClick={onClose}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
            activeModule === "dashboard"
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/8 hover:text-white"
          }`}
        >
          <LayoutDashboard size={16} className="shrink-0 text-white/60" />
          <span>Tableau de bord</span>
          {activeModule === "dashboard" && (
            <ChevronRight size={12} className="ml-auto text-white/40" />
          )}
        </Link>
      </div>

      {/* Groupes par module */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-1">
        {modules
          .filter((m) => m.visible)
          .map((m) => {
            const visibleItems = m.items.filter((i) => i.visible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={m.id}>
                <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-widest text-white/35">
                  {m.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = isNavItemActive(item.href, pathname);
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        onPointerEnter={() => prefetchHref(item.href)}
                        onClick={onClose}
                        className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white/15 text-white shadow-sm"
                            : "text-white/65 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <ItemIcon
                          size={15}
                          className={`shrink-0 ${isActive ? "text-white" : "text-white/50"}`}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && <ChevronRight size={11} className="shrink-0 text-white/40" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <UserAvatar initial={userAvatarInitial} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{userDisplayName}</p>
            <p className="text-[10px] text-white/40">Connecté</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// APP SHELL PRINCIPAL
// ---------------------------------------------------------------------------

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

  /** Précharge la page dès le survol / contact (clic perçu plus rapide). */
  const prefetchHref = useCallback(
    (href: string) => {
      if (!href) return;
      try {
        void router.prefetch(href);
      } catch {
        /* noop */
      }
    },
    [router],
  );

  const activeModule = detectModule(pathname);

  // ── Modules et items ─────────────────────────────────────────────────────
  const modules: ModuleDef[] = [
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
  ];

  const activeModuleDef =
    activeModule !== "dashboard"
      ? (modules.find((m) => m.id === activeModule) ?? null)
      : null;

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const pageSlug  = pathname.split("/").filter(Boolean).pop() ?? "";
  const pageLabel = pageSlug.replace(/-/g, " ");

  return (
    <div className="min-h-screen bg-graylight text-darktext">

      {/* ── Overlay mobile ─────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar mobile slide-in (unifiée) ──────────────────────────────── */}
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
          prefetchHref={prefetchHref}
        />
      </aside>

      {/* ── Layout desktop ─────────────────────────────────────────────────── */}
      <div className="flex min-h-screen">

        {/* ── PRIMARY SIDEBAR (collapsible) ────────────────────────────────── */}
        <aside
          className={`hidden shrink-0 bg-primary transition-all duration-300 ease-in-out md:block ${
            isSidebarOpen ? "w-[72px]" : "w-0 overflow-hidden"
          }`}
        >
          {/* sticky pour coller au viewport en scroll */}
          <div className="sticky top-0 h-screen w-[72px]">
            <PrimarySidebar
              modules={modules}
              activeModule={activeModule}
              userAvatarInitial={userAvatarInitial}
              onLogout={handleLogout}
              prefetchHref={prefetchHref}
            />
          </div>
        </aside>

        {/* ── Zone droite (topbar + corps) ─────────────────────────────────── */}
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">

          {/* ── TOPBAR ───────────────────────────────────────────────────────── */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">

            <div className="flex items-center gap-2">
              {/* Toggle sidebar — desktop */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen((o) => !o)}
                className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 md:flex"
                title={isSidebarOpen ? "Réduire le menu" : "Ouvrir le menu"}
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
              </button>

              {/* Hamburger — mobile */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>

              {/* Breadcrumb — desktop */}
              <div className="hidden items-center gap-2 md:flex">
                <span className="text-sm text-gray-400">{appConfig.name}</span>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="text-sm font-medium text-gray-500">
                  {MODULE_LABELS[activeModule]}
                </span>
                {pageLabel && pageLabel !== MODULE_LABELS[activeModule].toLowerCase() && (
                  <>
                    <ChevronRight size={14} className="text-gray-300" />
                    <span className="text-sm font-semibold capitalize text-darktext">
                      {pageLabel}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Logo centré — mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <Image src={getLogoUrl()} alt={appConfig.name} width={24} height={24} className="rounded object-contain" unoptimized />
              <span className="text-sm font-bold text-darktext">{appConfig.name}</span>
            </div>

            <div className="sm:hidden">
              <CurrencySwitcher />
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <CurrencySwitcher />
              {/* User pill */}
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

          {/* ── CORPS : secondary sidebar + contenu page ─────────────────────── */}
          <div className="flex min-h-0 flex-1 overflow-hidden">

            {/* ── SECONDARY SIDEBAR (carte flottante, sous la topbar) ─────────── */}
            {isSidebarOpen && (
              <SecondarySidebarPanel
                module={activeModuleDef}
                pathname={pathname}
                prefetchHref={prefetchHref}
              />
            )}

            {/* ── CONTENU DE LA PAGE ───────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>

        </div>
      </div>
    </div>
  );
}
