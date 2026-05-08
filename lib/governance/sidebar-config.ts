import {
  DEPARTMENT_NAVIGATION,
  listSupervisedDepartments,
  type DepartmentKey,
} from "@/lib/departments/department-config";

export type GovernanceSidebarItem = {
  href: string;
  label: string;
  iconKey: string;
  section: "enterprise_governance" | "department_supervision" | "administration";
};

export function getSuperAdminSidebarItems(): GovernanceSidebarItem[] {
  const base: GovernanceSidebarItem[] = [
    {
      href: "/dashboard",
      label: "Accueil",
      iconKey: "LayoutDashboard",
      section: "enterprise_governance",
    },
    {
      href: "/admin/global-dashboard",
      label: "Tableau de bord global",
      iconKey: "BarChart3",
      section: "enterprise_governance",
    },
    {
      href: "/admin/activity-logs",
      label: "Activite globale",
      iconKey: "ClipboardList",
      section: "enterprise_governance",
    },
    {
      href: "/admin/approvals",
      label: "Approbations",
      iconKey: "CheckCircle2",
      section: "enterprise_governance",
    },
    {
      href: "/admin/alerts",
      label: "Alertes",
      iconKey: "Bell",
      section: "enterprise_governance",
    },
    {
      href: "/admin/audit",
      label: "Audit entreprise",
      iconKey: "ClipboardList",
      section: "enterprise_governance",
    },
    {
      href: "/admin/intelligence",
      label: "Intelligence",
      iconKey: "BarChart3",
      section: "enterprise_governance",
    },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      iconKey: "UserCog",
      section: "administration",
    },
    {
      href: "/admin/archives",
      label: "Archives globales",
      iconKey: "Archive",
      section: "administration",
    },
    {
      href: "/admin/currency",
      label: "Parametres",
      iconKey: "Settings2",
      section: "administration",
    },
  ];

  const departmentLinks: GovernanceSidebarItem[] = listSupervisedDepartments()
    .map((key) => ({
      href: `/admin/departments/${String(key).toLowerCase()}`,
      label: DEPARTMENT_NAVIGATION[key].label,
      iconKey: DEPARTMENT_NAVIGATION[key].icon,
      section: "department_supervision" as const,
    }));

  return [...base, ...departmentLinks];
}

export function parseDepartmentKeySlug(slug: string): DepartmentKey | null {
  const normalized = String(slug ?? "").trim().toUpperCase();
  if (!(normalized in DEPARTMENT_NAVIGATION)) return null;
  return normalized as DepartmentKey;
}
