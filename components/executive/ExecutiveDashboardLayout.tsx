import type { ReactNode } from "react";

export function ExecutiveDashboardLayout({
  header,
  top,
  left,
  right,
}: {
  header?: ReactNode;
  top?: ReactNode;
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {header}
      {top}
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-8">{left}</div>
        <div className="space-y-4 lg:col-span-4">{right}</div>
      </div>
    </div>
  );
}

