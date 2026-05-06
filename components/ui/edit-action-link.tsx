"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  entityIdFromResourcePath,
  withEditModalQuery,
} from "@/lib/routing/modal-query";

type EditActionLinkProps = {
  href: string;
  /** Libellé bouton (mode texte) ou infobulle / aria en `iconOnly`. */
  label?: string;
  iconOnly?: boolean;
  className?: string;
  /** Surcharge de l’infobulle native (`title`) en mode icône seule. */
  title?: string;
  /** Id ressource pour `?edit=<id>` ; défaut = dernier segment du chemin `href`. */
  entityId?: string;
};

/**
 * Action de modification factorisée:
 * - normalise le style du bouton
 * - force l'ouverture en popup via ?edit=<id>
 */
export function EditActionLink({
  href,
  label = "Modifier",
  iconOnly = false,
  className,
  title: titleProp,
  entityId: entityIdProp,
}: EditActionLinkProps) {
  const resolvedId = entityIdProp ?? entityIdFromResourcePath(href);
  const finalHref =
    resolvedId != null && resolvedId !== ""
      ? withEditModalQuery(href, resolvedId)
      : href;
  const tip = titleProp ?? label;

  if (iconOnly) {
    return (
      <Link
        href={finalHref}
        title={tip}
        aria-label={tip}
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
