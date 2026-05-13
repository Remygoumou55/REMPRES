"use client";

import Link from "next/link";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { useTranslation } from "@/hooks/use-translation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DashboardWidgetShell } from "@/modules/dashboard-system/widgets";
import type { AdminPlatformOverviewModel } from "../types/domain";
import { useAdminPlatformDashboardRefresh } from "../hooks/use-admin-platform-refresh";

export function PlatformCommandCenter({ model }: { model: AdminPlatformOverviewModel }) {
  const { t } = useTranslation();
  const refresh = useAdminPlatformDashboardRefresh();

  return (
    <div className="page-wrapper mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("admin.platformDashboard.title", "Platform operations command center")}
        subtitle={t(
          "admin.platformDashboard.subtitle",
          "Observability, infrastructure, governance and resilience — unified entry without parallel orchestration",
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${refresh.isPending ? "animate-spin" : ""}`} />
              {t("admin.platformDashboard.refresh", "Refresh cache")}
            </Button>
            <Link href={ROUTES.executive} className="text-sm font-medium text-primary hover:underline">
              {t("admin.platformDashboard.linkExecutive", "Executive dashboard")}
            </Link>
            <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
              {t("admin.platformDashboard.backAdmin", "Admin hub")}
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-gray-100 bg-white px-4 py-3 text-xs text-gray-600">
        <span className="font-mono text-[11px] text-gray-500">
          {t("admin.platformDashboard.correlation", "Correlation")}: {model.correlationId}
        </span>
        <span>
          {t("admin.platformDashboard.generatedAt", "Snapshot")}: {model.generatedAtIso}
        </span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {model.metrics.map((metric) => (
          <div key={metric.id} className="rounded-card border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500">{t(metric.labelKey, metric.id)}</p>
            <p className="mt-1 text-lg font-semibold text-darktext">{Number(metric.value ?? 0)}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {model.links.map((item) => (
          <DashboardWidgetShell
            key={`${item.surface}-${item.href}`}
            title={t(item.labelKey, item.surface)}
            subtitle={t(item.descriptionKey, "")}
            actions={<LayoutDashboard className="h-4 w-4 text-gray-400" aria-hidden />}
          >
            <Link
              href={item.href}
              className="inline-flex text-sm font-semibold text-primary hover:underline"
            >
              {t("admin.platformDashboard.open", "Open console")} →
            </Link>
          </DashboardWidgetShell>
        ))}
      </div>
    </div>
  );
}
