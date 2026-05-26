import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Blocks,
  BookOpen,
  Code2,
  Globe,
  LayoutDashboard,
  Link2,
  Plug,
  Radio,
  Store,
} from "lucide-react";

const BASE = "/admin/platform";

export type PlatformNavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Cartes affichées sur le hub /admin/platform.
 *
 * Chaque entrée doit obligatoirement correspondre à une page Next existante
 * sous app/(app)/admin/platform/<slug>/. Les entrées dont la page n'est pas
 * encore livrée (extensions, workflows, security, compliance, recovery,
 * billing, monitoring) ont été retirées pour ne plus produire de 404 depuis
 * le cockpit plateforme. Elles pourront être réintroduites au moment où la
 * page correspondante sera créée.
 */
export const PLATFORM_NAV: PlatformNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/plugins`, label: "Plugins", icon: Blocks },
  { href: `${BASE}/sdk`, label: "SDK", icon: Code2 },
  { href: `${BASE}/integrations`, label: "Intégrations", icon: Link2 },
  { href: `${BASE}/connectors`, label: "Connecteurs", icon: Plug },
  { href: `${BASE}/marketplace`, label: "Marketplace", icon: Store },
  { href: `${BASE}/events`, label: "Événements", icon: Radio },
  { href: `${BASE}/apis`, label: "APIs partenaires", icon: Globe },
  { href: `${BASE}/observability`, label: "Observabilité", icon: AppWindow },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: BookOpen },
];
