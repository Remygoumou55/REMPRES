"use client";

import { useMemo } from "react";
import type { DepartmentKey } from "@/lib/constants/departments";
import { getOperationalLinksForDepartment } from "../constants/registry";

export function useDepartmentOperationalLinks(deptKey: DepartmentKey) {
  return useMemo(() => getOperationalLinksForDepartment(deptKey), [deptKey]);
}
