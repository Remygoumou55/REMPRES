import { NAV_CONFIG } from "@/lib/constants/nav-config";
import { resolveDepartmentNavContextLabel } from "@/lib/navigation/department-sidebar-nav";

function findNavLabel(pathname: string): string | null {
  for (const section of NAV_CONFIG) {
    for (const item of section.items) {
      if (
        "href" in item &&
        item.href &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))
      ) {
        return item.label;
      }
      if (item.expandable && item.children) {
        for (const child of item.children) {
          const [path] = child.href.split("?");
          if (pathname === path || pathname.startsWith(`${path}/`)) {
            return child.label;
          }
        }
      }
    }
  }
  return null;
}

export function getNavContextLabelFromPath(
  pathname: string,
  departmentKey: string | null,
  isSuperAdmin: boolean,
): string {
  const fromNav = findNavLabel(pathname);
  if (fromNav) return fromNav;
  if (!isSuperAdmin) {
    return resolveDepartmentNavContextLabel(pathname, departmentKey);
  }
  return "Vue ERP";
}
