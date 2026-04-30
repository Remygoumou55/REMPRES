"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { withEditModalQuery } from "@/lib/routing/modal-query";

type EditActionLinkProps = {
  href: string;
  label?: string;
  iconOnly?: boolean;
  className?: string;
};

/**
 * Action de modification factorisée:
 * - normalise le style du bouton
 * - force l'ouverture en popup via ?edit=1
 */
export function EditActionLink({
  href,
  label = "Modifier",
  iconOnly = false,
  className,
}: EditActionLinkProps) {
  const finalHref = withEditModalQuery(href);

  if (iconOnly) {
    return (
      <Link
        href={finalHref}
        title={label}
        className={
          className ??
          "flex h-8 w-8 items-center justify-center rounded-xl text-primary transition hover:bg-primary/10"
        }
      >
        <Pencil size={15} />
      </Link>
    );
  }

  return (
    <Link
      href={finalHref}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10"
      }
    >
      <Pencil size={13} />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
