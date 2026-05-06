"use client";

import { memo } from "react";
import Link from "next/link";
import { type LucideIcon, ArrowRight } from "lucide-react";

export const QuickActionCard = memo(function QuickActionCard({
  href,
  icon: Icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-darktext">{label}</p>
        <p className="truncate text-xs text-gray-400">{description}</p>
      </div>
      <ArrowRight size={14} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
});
