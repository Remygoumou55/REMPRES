import Link from "next/link";
import type { ReactNode } from "react";

const baseClassName =
  "card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

type HubLinkCardProps = {
  href: string;
  title: string;
  description: string;
  /** Use for téléchargements / exports (`<a href>`) au lieu de navigation client */
  nativeAnchor?: boolean;
  className?: string;
  children?: ReactNode;
};

export function HubLinkCard({ href, title, description, nativeAnchor, className, children }: HubLinkCardProps) {
  const cn = [baseClassName, className].filter(Boolean).join(" ");
  const body = (
    <>
      <p className="text-sm font-semibold text-darktext">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
      {children}
    </>
  );

  if (nativeAnchor) {
    return (
      <a href={href} className={cn}>
        {body}
      </a>
    );
  }

  return (
    <Link href={href} className={cn}>
      {body}
    </Link>
  );
}
