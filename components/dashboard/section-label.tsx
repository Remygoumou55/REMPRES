import type { ReactNode } from "react";

export type SectionLabelProps = {
  label: string;
  rightSlot?: ReactNode;
};

export function SectionLabel({ label, rightSlot }: SectionLabelProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <h2
        className="text-[11px] font-medium uppercase tracking-[0.15em]"
        style={{ color: "var(--muted-foreground, #6b7280)" }}
      >
        {label}
      </h2>
      {rightSlot ? (
        <span className="text-[11px] italic text-gray-500">{rightSlot}</span>
      ) : null}
    </div>
  );
}
