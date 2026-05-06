import type { LucideIcon } from "lucide-react";

export type ModuleId = "dashboard" | "commerce" | "finance" | "admin" | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible: boolean;
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
