import type { DepartmentOperationalLink } from "../types/domain";

import { resolvePlatformAdminHub } from "@/lib/navigation/platform-route-registry";

export const OBSERVABILITY_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "obs-hub",
    vertical: "observability",
    href: resolvePlatformAdminHub("observability"),
    labelKey: "deptDash.observability.link.hub",
  },
];
