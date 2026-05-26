"use client";

import type { ReactNode } from "react";

export type DashboardBannerProps = {
  greeting: string;
  firstName: string;
  date: string;
  time: string;
  subtitle?: string;
  /** Petit libellé sur-titre (affiché en majuscules). Défaut : « Supervision globale ». */
  eyebrow?: string;
  platformOk: boolean;
  priorityCount: number;
  children?: ReactNode;
};

export function DashboardBanner({
  greeting,
  firstName,
  date,
  time,
  subtitle,
  eyebrow,
  platformOk,
  priorityCount,
  children,
}: DashboardBannerProps) {
  return (
    <header
      className="rounded-2xl p-7 text-white shadow-sm sm:px-8"
      style={{
        background: "linear-gradient(135deg, #0E4A8A 0%, #2D7CC4 60%, #3FA9D6 100%)",
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
            {eyebrow ?? "Supervision globale"}
          </p>
          <h1 className="text-[26px] font-medium tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-[13px] text-white/70">
            <span className="capitalize">{date}</span>
            <span className="mx-2">·</span>
            <span className="tabular-nums">{time}</span>
            <span className="mx-2">·</span>
            <span>{subtitle || "Cockpit central"}</span>
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div
            className="flex min-w-[160px] flex-col gap-0.5 rounded-xl border px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Plateforme</span>
            <span className="text-sm font-medium">
              {platformOk ? (
                <span style={{ color: "#6EE7B7" }}>✓ Opérationnelle</span>
              ) : (
                <span style={{ color: "#FCD34D" }}>⚠ À surveiller</span>
              )}
            </span>
          </div>
          {priorityCount > 0 ? (
            <div
              className="flex min-w-[160px] flex-col gap-0.5 rounded-xl border px-4 py-2.5"
              style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Priorités</span>
              <span className="text-sm font-medium">{priorityCount} action(s)</span>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </header>
  );
}
