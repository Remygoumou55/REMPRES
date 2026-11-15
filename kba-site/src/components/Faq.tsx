import { Plus } from "lucide-react";
import type { FaqItem } from "@/data/content";

/** Questions dépliantes, sans JavaScript (balises details/summary). */
export function Faq({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {f.q}
            <Plus className="h-4 w-4 shrink-0 text-blue-600 transition-transform group-open:rotate-45" />
          </summary>
          <p className="max-w-3xl pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
