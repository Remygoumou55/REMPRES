import type { LucideIcon } from "lucide-react";

export type ModuleId =
  | "dashboard"
  | "direction"
  | "dept"
  | "commerce"
  | "actions"
  | "archives"
  | "finance"
  | "admin"
  | "config";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
  section?: string;
};

export type ModuleDef = {
  id: ModuleId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  href: string;
  visible: boolean;
  items: NavItem[];
};
