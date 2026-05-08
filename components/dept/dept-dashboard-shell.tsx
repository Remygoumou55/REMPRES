"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

type DeptDashboardShellProps = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  backHref: string;
  backLabel: string;
  isLoading?: boolean;
  isRefetching?: boolean;
  onRefresh: () => void;
  lastUpdated?: string | null;
  children: React.ReactNode;
};

export function DeptDashboardShell({
  title,
  subtitle,
  icon,
  color,
  backHref,
  backLabel,
  isRefetching = false,
  onRefresh,
  lastUpdated,
  children,
}: DeptDashboardShellProps) {
  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between gap-3">
        <Link href={backHref} className="text-sm font-medium text-primary hover:underline">
          {backLabel}
        </Link>
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          <span>{lastUpdated ? `Mis à jour: ${lastUpdated}` : "Mis à jour: --"}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <div className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: color + "1A", color }}>
            {icon}
            <span className="font-medium">{title}</span>
          </div>
        }
      />

      {children}
    </div>
  );
}

