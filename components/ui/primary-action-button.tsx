import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Style canonique des actions « Nouveau … » (aligné Clients / Produits Vente). */
export const primaryActionButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50";

type PrimaryActionButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  showIcon?: boolean;
  "aria-label"?: string;
};

export function PrimaryActionButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  className,
  showIcon = true,
  "aria-label": ariaLabel,
}: PrimaryActionButtonProps) {
  const content = (
    <>
      {showIcon ? <Plus className="h-4 w-4 shrink-0" aria-hidden /> : null}
      <span>{children}</span>
    </>
  );

  const cls = cn(primaryActionButtonClassName, className);

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
