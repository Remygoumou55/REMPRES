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
  type LucideIcon,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";

type AppShellProps = {
  email: string | null;
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadActivityLogs: boolean;
  isSuperAdmin?: boolean;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
};

type SidebarContentProps = {
  email: string | null;
  navItems: NavItem[];
  pathname: string;
  onClose?: (() => void) | undefined;
};

function SidebarContent({ email, navItems, pathname, onClose }: SidebarContentProps) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={getLogoUrl()}
            alt={`${appConfig.name} logo`}
            width={36}
            height={36}
            className="rounded-md object-contain"
            unoptimized
          />
          <div>
            <p className="text-base font-bold leading-tight">{appConfig.name}</p>
            <p className="text-[11px] text-white/70">Espace de gestion</p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/80 hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-md py-2 pr-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-l-[3px] border-white bg-[#2D7CC4] pl-[9px] text-white"
                    : "pl-3 text-white/90 hover:bg-[#2D7CC4]/60"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-white/15 px-5 py-4 text-xs text-white/80">
        Connecté : {email ?? "Utilisateur"}
      </div>
    </>
  );
}

export function AppShell({
  email,
  canReadClients,
  canReadProducts,
  canReadActivityLogs,
  isSuperAdmin = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/dashboard",            label: "Dashboard",         icon: LayoutDashboard, visible: true },
    { href: "/vente/clients",        label: "Clients",           icon: Users,           visible: canReadClients },
    { href: "/vente/produits",       label: "Produits",          icon: Package,         visible: canReadProducts },
    { href: "/vente/nouvelle-vente", label: "Nouvelle vente",    icon: ShoppingCart,    visible: canReadProducts },
    { href: "/vente/historique",     label: "Historique ventes", icon: History,         visible: canReadProducts },
    {
      href: "/admin/activity-logs",
      label: "Journal d'activité",
      icon: ClipboardList,
      visible: canReadActivityLogs,
    },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      icon: UserCog,
      visible: isSuperAdmin,
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
      {/* ── Mobile overlay ── */}
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* ── Mobile sidebar (slide-in depuis la gauche) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-primary text-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          email={email}
          navItems={navItems}
          pathname={pathname}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </aside>

      {/* ── Layout principal ── */}
      <div className="flex min-h-screen">
        {/* ── Desktop sidebar (toujours visible) ── */}
        <aside className="hidden w-[260px] flex-shrink-0 flex-col bg-primary text-white md:flex">
          <SidebarContent email={email} navItems={navItems} pathname={pathname} />
        </aside>

        {/* ── Zone contenu ── */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Bouton hamburger — mobile uniquement */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-md p-2 text-darktext hover:bg-graylight md:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu size={24} />
              </button>
              {/* Logo visible uniquement sur desktop (la sidebar est cachée sur mobile) */}
              <div className="hidden items-center gap-2 md:flex">
                <Image
                  src={getLogoUrl()}
                  alt={appConfig.name}
                  width={28}
                  height={28}
                  className="rounded object-contain"
                  unoptimized
                />
                <p className="text-sm font-bold text-darktext">{appConfig.name}</p>
              </div>
              <span className="hidden text-gray-300 md:block">|</span>
              <p className="text-xs text-darktext/60">{email ?? "Utilisateur"}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md bg-danger px-3 py-2 text-sm font-medium text-white"
            >
              Se déconnecter
            </button>
          </header>

          <div className="flex-1 p-4 md:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
