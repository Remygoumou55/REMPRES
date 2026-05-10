import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Brain,
  ClipboardList,
  FileStack,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Layers,
  Link2,
  Radar,
  ScrollText,
  ShieldCheck,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

const BASE = "/admin/governance-platform";

export type GovernancePlatformNavItem = { href: string; label: string; icon: LucideIcon };

export const GOVERNANCE_PLATFORM_NAV: GovernancePlatformNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/architecture`, label: "Architecture board", icon: Layers },
  { href: `${BASE}/adr`, label: "ADR", icon: FileStack },
  { href: `${BASE}/documentation`, label: "Documentation", icon: BookOpen },
  { href: `${BASE}/standards`, label: "Standards", icon: ScrollText },
  { href: `${BASE}/debt`, label: "Dette technique", icon: GitBranch },
  { href: `${BASE}/reliability`, label: "Fiabilité", icon: Gauge },
  { href: `${BASE}/lifecycle`, label: "Lifecycle plateforme", icon: Target },
  { href: `${BASE}/dependencies`, label: "Dépendances", icon: Link2 },
  { href: `${BASE}/ai`, label: "IA & maturité", icon: Brain },
  { href: `${BASE}/observability`, label: "Observabilité", icon: Radar },
  { href: `${BASE}/compliance`, label: "Conformité fédérée", icon: ShieldCheck },
  { href: `${BASE}/quality`, label: "Qualité engineering", icon: ClipboardList },
  { href: `${BASE}/analytics`, label: "Analytics maturité", icon: BarChart3 },
  { href: `${BASE}/maturity`, label: "Maturité", icon: TrendingUp },
  { href: `${BASE}/performance`, label: "Performance", icon: Zap },
];
