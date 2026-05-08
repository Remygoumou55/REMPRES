import { DEPARTMENT_NAVIGATION } from "@/lib/departments/department-config";
import type { ModuleDef, NavItem } from "@/components/layout/app-shell/types";

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function isDepartmentHref(href: string, departmentPrefixes: readonly string[]): boolean {
  return departmentPrefixes.some((prefix) => matchesPrefix(href, prefix));
}

function scopeItems(items: NavItem[], departmentPrefixes: readonly string[]): NavItem[] {
  return items.map((item) => ({
    ...item,
    visible: item.visible && isDepartmentHref(item.href, departmentPrefixes),
  }));
}

/**
 * En contexte départemental, on n'affiche que le module et les entrées du département courant.
 * Hors contexte départemental (/dashboard, /settings, /admin...), on conserve la navigation standard.
 */
export function scopeModulesToCurrentDepartment(
  modules: ModuleDef[],
  pathname: string,
  isSuperAdmin: boolean,
): ModuleDef[] {
  if (isSuperAdmin) return modules;

  const departmentPrefixes = Object.values(DEPARTMENT_NAVIGATION)
    .filter((entry) => entry.routePrefixes.length > 0)
    .flatMap((entry) => entry.routePrefixes)
    .filter((prefix) => matchesPrefix(pathname, prefix));

  if (departmentPrefixes.length === 0) return modules;

  return modules.map((module) => {
    const scopedItems = scopeItems(module.items, departmentPrefixes);
    const hasVisibleItem = scopedItems.some((item) => item.visible);
    const moduleIsDepartmentModule = isDepartmentHref(module.href, departmentPrefixes);
    return {
      ...module,
      visible: module.visible && moduleIsDepartmentModule && hasVisibleItem,
      items: scopedItems,
    };
  });
}

