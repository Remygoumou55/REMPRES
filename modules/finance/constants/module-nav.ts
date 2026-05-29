import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  Receipt,
  Scale,
  ShieldCheck,
} from "lucide-react";

export type FinanceModuleNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const FINANCE_MODULE_NAV: FinanceModuleNavItem[] = [
  { href: "/finance", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/finance", label: "Transactions", icon: ArrowLeftRight },
  { href: "/finance/depenses", label: "Dépenses", icon: Receipt },
  { href: "/finance/bilans", label: "Bilans", icon: Scale },
  { href: "/finance/rapprochement", label: "Rapprochement", icon: Landmark },
  { href: "/finance/audit", label: "Audit", icon: ShieldCheck },
];
