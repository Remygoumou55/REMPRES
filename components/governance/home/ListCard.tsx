import { memo } from "react";

type ListCardProps = {
  title: string;
  items: readonly string[];
};

export const ListCard = memo(function ListCard({ title, items }: ListCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-600">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});
