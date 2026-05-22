import type { ReactNode } from "react";

export function SettingsSectionShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-darktext">{title}</h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
