import type { ReactNode } from "react";

export function CrmSectionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-indigo-50 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-darktext">{title}</h2>
      {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
