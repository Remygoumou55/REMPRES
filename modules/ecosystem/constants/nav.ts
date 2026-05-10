import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  Award,
  BarChart3,
  Bot,
  CreditCard,
  LayoutDashboard,
  Lock,
  Plug,
  Radar,
  RefreshCw,
  Route,
  ScrollText,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";

const BASE = "/admin/ecosystem";

export type EcosystemNavItem = { href: string; label: string; icon: LucideIcon };

export const ECOSYSTEM_NAV: EcosystemNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/partners`, label: "Partenaires", icon: Users },
  { href: `${BASE}/federation`, label: "Fédération", icon: ArrowLeftRight },
  { href: `${BASE}/connectors`, label: "Connecteurs", icon: Plug },
  { href: `${BASE}/certifications`, label: "Certifications", icon: Award },
  { href: `${BASE}/workflows`, label: "Workflows", icon: Workflow },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: ShieldCheck },
  { href: `${BASE}/analytics`, label: "Analytics", icon: BarChart3 },
  { href: `${BASE}/observability`, label: "Observabilité", icon: Radar },
  { href: `${BASE}/security`, label: "Sécurité", icon: Lock },
  { href: `${BASE}/compliance`, label: "Conformité", icon: ScrollText },
  { href: `${BASE}/routing`, label: "Routage", icon: Route },
  { href: `${BASE}/recovery`, label: "Recovery", icon: RefreshCw },
  { href: `${BASE}/billing`, label: "Billing", icon: CreditCard },
  { href: `${BASE}/ai`, label: "AI fédéré", icon: Bot },
  { href: `${BASE}/monitoring`, label: "Monitoring", icon: Activity },
];
