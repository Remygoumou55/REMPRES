"use client";

import { memo } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  FileText,
  GitBranch,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Package,
  PieChart,
  Receipt,
  ShoppingCart,
  Target,
  UserPlus,
  Users,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { QuickActionCard } from "@/app/(app)/dashboard/components/QuickActionCard";
import { SectionLabel } from "@/components/dashboard/section-label";
import type { DepartmentKey } from "@/lib/constants/departments";
import { getDeptQuickActions } from "@/lib/navigation/dept-quick-actions";

const QUICK_ACTION_ICONS: Record<string, LucideIcon> = {
  new_sale: ShoppingCart,
  new_client: Users,
  new_lead: UserPlus,
  new_quote: FileText,
  pipeline: GitBranch,
  crm_hub: Target,
  cfo: LineChart,
  expenses: Receipt,
  enterprise: BookOpen,
  treasury: Landmark,
  invoicing: FileText,
  reporting: PieChart,
  rh_hub: LayoutDashboard,
  collaborateurs: Users,
  conges: Calendar,
  presences: CheckCircle,
  contrats: ClipboardList,
  recrutement: UserPlus,
  formation_hub: GraduationCap,
  formations: GraduationCap,
  apprenants: Users,
  inscriptions: ClipboardList,
  certificats: Award,
  consultation: Briefcase,
  consultation_hub: Briefcase,
  missions: Briefcase,
  agenda: Calendar,
  clients: Building2,
  formation_link: GraduationCap,
  dept_formation: BarChart3,
  marketing_hub: Megaphone,
  campagnes: Megaphone,
  leads: Target,
  crm_leads: UserPlus,
  crm_pipeline: GitBranch,
  log_hub: LayoutDashboard,
  stock: Package,
  mouvements: ArrowLeftRight,
  entrepots: Warehouse,
  alertes: AlertTriangle,
  achats: ShoppingCart,
};

const QUICK_ACTION_COLORS: Record<string, string> = {
  new_sale: "bg-emerald-50 text-emerald-700",
  new_client: "bg-blue-50 text-blue-700",
  new_lead: "bg-indigo-50 text-indigo-700",
  new_quote: "bg-violet-50 text-violet-700",
  pipeline: "bg-amber-50 text-amber-700",
  crm_hub: "bg-sky-50 text-sky-700",
  cfo: "bg-emerald-50 text-emerald-700",
  expenses: "bg-orange-50 text-orange-700",
  enterprise: "bg-blue-50 text-blue-700",
  treasury: "bg-violet-50 text-violet-700",
  invoicing: "bg-sky-50 text-sky-700",
  reporting: "bg-slate-50 text-slate-700",
  rh_hub: "bg-violet-50 text-violet-700",
  collaborateurs: "bg-blue-50 text-blue-700",
  conges: "bg-amber-50 text-amber-700",
  presences: "bg-emerald-50 text-emerald-700",
  contrats: "bg-indigo-50 text-indigo-700",
  recrutement: "bg-pink-50 text-pink-700",
  formation_hub: "bg-amber-50 text-amber-700",
  formations: "bg-orange-50 text-orange-700",
  apprenants: "bg-blue-50 text-blue-700",
  inscriptions: "bg-violet-50 text-violet-700",
  certificats: "bg-emerald-50 text-emerald-700",
  consultation: "bg-blue-50 text-blue-800",
  consultation_hub: "bg-blue-50 text-blue-800",
  missions: "bg-indigo-50 text-indigo-700",
  agenda: "bg-amber-50 text-amber-700",
  clients: "bg-purple-50 text-purple-700",
  formation_link: "bg-orange-50 text-orange-700",
  dept_formation: "bg-amber-50 text-amber-800",
  marketing_hub: "bg-pink-50 text-pink-700",
  campagnes: "bg-fuchsia-50 text-fuchsia-700",
  leads: "bg-sky-50 text-sky-700",
  crm_leads: "bg-indigo-50 text-indigo-700",
  crm_pipeline: "bg-amber-50 text-amber-700",
  log_hub: "bg-slate-50 text-slate-700",
  stock: "bg-blue-50 text-blue-700",
  mouvements: "bg-violet-50 text-violet-700",
  entrepots: "bg-indigo-50 text-indigo-700",
  alertes: "bg-red-50 text-red-700",
  achats: "bg-emerald-50 text-emerald-700",
};

export type DeptQuickActionsSectionProps = {
  dept: DepartmentKey;
  deptLabel: string;
};

export const DeptQuickActionsSection = memo(function DeptQuickActionsSection({
  dept,
  deptLabel,
}: DeptQuickActionsSectionProps) {
  const actions = getDeptQuickActions(dept);
  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="dept-quick-actions-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <SectionLabel label={`ACTIONS RAPIDES — ${deptLabel.toUpperCase()}`} />
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
          <Zap size={12} className="text-primary" aria-hidden />
          Accès directs aux modules métier
        </span>
      </div>

      <div
        id="dept-quick-actions-heading"
        className="card grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3"
      >
        {actions.map((action) => {
          const Icon = QUICK_ACTION_ICONS[action.id] ?? LayoutDashboard;
          const color = QUICK_ACTION_COLORS[action.id] ?? "bg-gray-50 text-gray-700";
          return (
            <QuickActionCard
              key={action.id}
              href={action.href}
              icon={Icon}
              label={action.label}
              description={action.description}
              color={color}
            />
          );
        })}
      </div>
    </section>
  );
});
