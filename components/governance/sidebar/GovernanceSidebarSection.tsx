import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

type GovernanceSidebarSectionItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type GovernanceSidebarSectionProps = {
  title: string;
  items: GovernanceSidebarSectionItem[];
  pathname: string;
};

function isNavItemActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GovernanceSidebarSection({
  title,
  items,
  pathname,
}: GovernanceSidebarSectionProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = isNavItemActive(item.href, pathname);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-darktext"
              }`}
            >
              <ItemIcon
                size={15}
                className={`shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
                }`}
              />
              <span className="flex-1 truncate font-medium">{item.label}</span>
              {isActive ? <ChevronRight size={12} className="shrink-0 text-white/60" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
