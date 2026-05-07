import Link from "next/link";

type GovernanceBreadcrumbProps = {
  items: { href: string; label: string }[];
};

export function GovernanceBreadcrumb({ items }: GovernanceBreadcrumbProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
      {items.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <Link href={item.href} className="hover:text-gray-800 hover:underline">
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
