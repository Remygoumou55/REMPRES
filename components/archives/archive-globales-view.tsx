"use client";

import Link from "next/link";
import { memo } from "react";
import { NavIcon } from "@/components/ui/nav-icon";
import type { ArchiveGlobalesDeptCard } from "@/lib/server/archives";

export const ArchiveGlobalesView = memo(function ArchiveGlobalesView({
  cards,
}: {
  cards: ArchiveGlobalesDeptCard[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.key}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          style={{ borderLeftWidth: 3, borderLeftColor: card.borderColor }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50"
              style={{ color: card.iconColor }}
            >
              <NavIcon iconName={card.icon} size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{card.label}</h2>
              <p className="text-2xl font-medium text-gray-900">{card.count.toLocaleString("fr-FR")}</p>
            </div>
          </div>
          <Link
            href={card.href}
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            Voir les archives →
          </Link>
        </article>
      ))}
    </div>
  );
});
