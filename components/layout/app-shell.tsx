"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  Wallet,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppShellProps = {
  email: string | null;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  /** Module Finance (dépenses) */
  canReadFinance?: boolean;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// ---------------------------------------------------------------------------
// Avatar initiales
// ---------------------------------------------------------------------------

function UserAvatar({ email }: { email: string | null }) {
  const initial = (email ?? "U").charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
      {initial}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar content
// ---------------------------------------------------------------------------

type SidebarContentProps = {
  email: string | null;
  groups: NavGroup[];
  pathname: string;
  onClose?: () => void;
  onLogout: () => void;
};

function SidebarContent({ email, groups, pathname, onClose, onLogout }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={getLogoUrl()}
            alt={`${appConfig.name} logo`}
            width={34}
            height={34}
            className="rounded-xl object-contain"
            unoptimized
          />
          <div>
            <p className="text-sm font-bold leading-tight text-white">{appConfig.name}</p>
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">ERP</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {groups.map((group) => {
          const visibleItems = group.items.filter((i) => i.visible);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/finance"
                      ? pathname === "/finance"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/70 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-white/60"}`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && (
                        <ChevronRight size={12} className="text-white/40" />
                      )}
                      {item.badge && (
                        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User card ── */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <UserAvatar email={email} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {email ?? "Utilisateur"}
            </p>
            <p className="text-[10px] text-white/40">Connecté</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AppShell principal
// ---------------------------------------------------------------------------

export function AppShell({
  email,
  canReadClients,
  canReadProducts,
  canReadActivityLogs,
  isSuperAdmin = false,
  canReadFinance = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navGroups: NavGroup[] = [
    {
      label: "Principal",
      items: [
        { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, visible: true },
      ],
    },
    {
      label: "Commerce",
      items: [
        { href: "/vente/clients",        label: "Clients",         icon: Users,       visible: canReadClients  },
        { href: "/vente/produits",       label: "Produits",        icon: Package,     visible: canReadProducts },
        { href: "/vente/nouvelle-vente", label: "Nouvelle vente",  icon: ShoppingCart, visible: canReadProducts },
        { href: "/vente/historique",     label: "Historique",      icon: History,     visible: canReadProducts },
      ],
    },
    {
      label: "Finance",
      items: [
        { href: "/finance", label: "Vue d'ensemble", icon: BarChart3, visible: canReadFinance },
        { href: "/finance/depenses", label: "Dépenses", icon: Wallet, visible: canReadFinance },
      ],
    },
    {
      label: "Administration",
      items: [
        { href: "/admin/activity-logs", label: "Journal activité", icon: ClipboardList, visible: canReadActivityLogs },
        { href: "/admin/users",          label: "Utilisateurs",    icon: UserCog,       visible: isSuperAdmin },
      ],
    },
  ];

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-graylight text-darktext">

      {/* ── Overlay mobile ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar mobile (slide-in) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-primary shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          email={email}
          groups={navGroups}
          pathname={pathname}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Layout principal ── */}
      <div className="flex min-h-screen">

        {/* ── Sidebar desktop ── */}
        <aside className="hidden w-[240px] shrink-0 bg-primary md:block">
          <div className="sticky top-0 h-screen">
            <SidebarContent
              email={email}
              groups={navGroups}
              pathname={pathname}
              onLogout={handleLogout}
            />
          </div>
        </aside>

        {/* ── Zone contenu principale ── */}
        <div className="flex min-h-screen flex-1 flex-col overflow-hidden">

          {/* ── Topbar ── */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
            {/* Hamburger mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>

            {/* Fil d'ariane / page title — desktop */}
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-gray-400">RemPres</span>
              <ChevronRight size={14} className="text-gray-300" />
              <span className="text-sm font-medium text-darktext capitalize">
                {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? "Accueil"}
              </span>
            </div>

            {/* Logo centré — mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <Image src={getLogoUrl()} alt={appConfig.name} width={24} height={24} className="rounded object-contain" unoptimized />
              <span className="text-sm font-bold text-darktext">{appConfig.name}</span>
            </div>

            {/* User pill */}
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {(email ?? "U").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate text-xs font-medium text-gray-700">
                  {email ?? "Utilisateur"}
                </span>
              </div>
            </div>
          </header>

          {/* ── Contenu ── */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
