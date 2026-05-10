import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  BookMarked,
  BookOpen,
  ClipboardList,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  ListChecks,
  PieChart,
  Receipt,
  Scale,
  ScrollText,
} from "lucide-react";

export type FinanceEnterpriseNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const BASE = "/finance/enterprise";

export const FINANCE_ENTERPRISE_NAV: FinanceEnterpriseNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/journal`, label: "Journal", icon: BookOpen },
  { href: `${BASE}/grand-livre`, label: "Grand livre", icon: BookMarked },
  { href: `${BASE}/balance`, label: "Balance", icon: Scale },
  { href: `${BASE}/facturation`, label: "Facturation", icon: ClipboardList },
  { href: `${BASE}/paiements`, label: "Paiements", icon: ArrowLeftRight },
  { href: `${BASE}/depenses`, label: "Dépenses", icon: Receipt },
  { href: `${BASE}/budgets`, label: "Budgets", icon: PieChart },
  { href: `${BASE}/tresorerie`, label: "Trésorerie", icon: Landmark },
  { href: `${BASE}/cashflow`, label: "Cashflow", icon: Activity },
  { href: `${BASE}/reporting`, label: "Reporting", icon: FileBarChart },
  { href: `${BASE}/analytics`, label: "Analytics", icon: BarChart3 },
  { href: `${BASE}/workflows`, label: "Approvals", icon: ListChecks },
  { href: `${BASE}/audit`, label: "Audit", icon: ScrollText },
];
