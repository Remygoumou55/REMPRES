import type { DepartmentOperationalLink } from "../types/domain";

import { resolvePlatformAdminHub } from "@/lib/navigation/platform-route-registry";

export const CLOUD_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  {
    id: "cloud-hub",
    vertical: "cloud",
    href: resolvePlatformAdminHub("cloud"),
    labelKey: "deptDash.cloud.link.hub",
  },
];
