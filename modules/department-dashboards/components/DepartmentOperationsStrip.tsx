"use client";

import Link from "next/link";
import type { DepartmentKey } from "@/lib/constants/departments";
import { useTranslation } from "@/hooks/use-translation";
import { useDepartmentOperationalLinks } from "../hooks/use-department-operational-links";

export function DepartmentOperationsStrip({ deptKey }: { deptKey: DepartmentKey }) {
  const { t } = useTranslation();
  const links = useDepartmentOperationalLinks(deptKey);
  if (!links.length) return null;

  return (
    <section className="card border border-gray-100 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("deptDash.strip.title", "Operational dashboards & platform bridges")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
          >
            {t(item.labelKey, item.id)}
          </Link>
        ))}
      </div>
    </section>
  );
}
