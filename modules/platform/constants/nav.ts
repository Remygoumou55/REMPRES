import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AppWindow,
  Blocks,
  BookOpen,
  Code2,
  CreditCard,
  Globe,
  LayoutDashboard,
  Link2,
  Plug,
  Radio,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Store,
  Workflow,
} from "lucide-react";

const BASE = "/admin/platform";

export type PlatformNavItem = { href: string; label: string; icon: LucideIcon };

export const PLATFORM_NAV: PlatformNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/plugins`, label: "Plugins", icon: Plug },
  { href: `${BASE}/extensions`, label: "Extensions", icon: Blocks },
  { href: `${BASE}/sdk`, label: "SDK", icon: Code2 },
  { href: `${BASE}/integrations`, label: "Intégrations", icon: Link2 },
  { href: `${BASE}/marketplace`, label: "Marketplace", icon: Store },
  { href: `${BASE}/workflows`, label: "Workflows", icon: Workflow },
  { href: `${BASE}/events`, label: "Événements", icon: Radio },
  { href: `${BASE}/apis`, label: "APIs partenaires", icon: Globe },
  { href: `${BASE}/security`, label: "Sécurité", icon: ShieldCheck },
  { href: `${BASE}/compliance`, label: "Conformité", icon: ScrollText },
  { href: `${BASE}/observability`, label: "Observabilité", icon: AppWindow },
  { href: `${BASE}/recovery`, label: "Recovery", icon: RefreshCw },
  { href: `${BASE}/billing`, label: "Billing", icon: CreditCard },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: BookOpen },
  { href: `${BASE}/monitoring`, label: "Monitoring", icon: Activity },
];
