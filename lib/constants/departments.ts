import {
  ShoppingCart,
  BarChart3,
  Users,
  GraduationCap,
  Briefcase,
  Megaphone,
  Package,
  type LucideIcon,
} from "lucide-react";

export const DEPARTMENTS = [
  {
    key: "vente",
    label: "Vente",
    icon: ShoppingCart,
    color: "#2D7CC4",
    bgColor: "#EFF6FF",
    description: "Clients, produits, ventes et stock",
    route: "/dept/vente",
  },
  {
    key: "finance",
    label: "Finance",
    icon: BarChart3,
    color: "#10B981",
    bgColor: "#ECFDF5",
    description: "Revenus, dépenses et trésorerie",
    route: "/dept/finance",
  },
  {
    key: "rh",
    label: "Ressources Humaines",
    icon: Users,
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    description: "Employés, présences et recrutement",
    route: "/dept/rh",
  },
  {
    key: "formation",
    label: "Formation",
    icon: GraduationCap,
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    description: "Formations, apprenants et certificats",
    route: "/dept/formation",
  },
  {
    key: "consultation",
    label: "Consultation",
    icon: Briefcase,
    color: "#0E4A8A",
    bgColor: "#EFF6FF",
    description: "Missions, clients et livrables",
    route: "/dept/consultation",
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    color: "#EC4899",
    bgColor: "#FDF2F8",
    description: "Campagnes, leads et conversions",
    route: "/dept/marketing",
  },
  {
    key: "logistique",
    label: "Logistique",
    icon: Package,
    color: "#6B7280",
    bgColor: "#F9FAFB",
    description: "Stock matériel et approvisionnement",
    route: "/dept/logistique",
  },
] as const;

export type DepartmentKey = (typeof DEPARTMENTS)[number]["key"];

export type DepartmentRegistryItem = {
  key: DepartmentKey;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  description: string;
  route: string;
};

export function getDepartment(key: DepartmentKey) {
  return DEPARTMENTS.find((d) => d.key === key);
}

export const DEPARTMENT_LABELS: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.key, d.label]),
);

