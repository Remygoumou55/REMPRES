"use client";

import Link from "next/link";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import { useTranslation } from "@/hooks/use-translation";

type DeptCardProps = {
  departmentKey: DepartmentKey;
};

export function DeptCard({ departmentKey }: DeptCardProps) {
  const { t } = useTranslation();
  const department = DEPARTMENTS.find((d) => d.key === departmentKey);
  if (!department) return null;

  const Icon = department.icon;

  return (
    <Link
      href={department.route}
      className="card block cursor-pointer p-5 transition-all duration-200 hover:scale-[1.02]"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: department.bgColor }}
      >
        <Icon size={24} style={{ color: department.color }} />
      </div>
      <h3 className="mt-4 text-xl font-bold text-darktext">{department.label}</h3>
      <p className="mt-1 text-sm text-gray-500">{department.description}</p>
      <p className="mt-4 text-sm font-medium" style={{ color: department.color }}>
        {t("dashboard.dept.openDashboard", "Voir le tableau de bord")} →
      </p>
    </Link>
  );
}

