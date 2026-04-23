import type { LucideIcon } from "lucide-react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gray"
  | "primary"
  | "purple"
  | "orange"
  | "pink";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success: "bg-emerald-50  text-emerald-700 border-emerald-200",
  warning: "bg-amber-50    text-amber-700   border-amber-200",
  danger:  "bg-red-50      text-red-700     border-red-200",
  info:    "bg-sky-50      text-sky-700     border-sky-200",
  gray:    "bg-gray-100    text-gray-600    border-gray-200",
  primary: "bg-primary/10  text-primary     border-primary/20",
  purple:  "bg-violet-50   text-violet-700  border-violet-200",
  orange:  "bg-orange-50   text-orange-700  border-orange-200",
  pink:    "bg-pink-50     text-pink-700    border-pink-200",
};

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  icon?: LucideIcon;
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function Badge({
  label,
  variant = "gray",
  icon: Icon,
  dot = false,
  size = "sm",
  className = "",
}: BadgeProps) {
  const sizeClasses = size === "sm"
    ? "px-2 py-0.5 text-xs"
    : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${VARIANT_STYLES[variant]} ${className}`}
    >
      {dot && (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${
          variant === "success" ? "bg-emerald-500" :
          variant === "warning" ? "bg-amber-500" :
          variant === "danger"  ? "bg-red-500" :
          variant === "info"    ? "bg-sky-500" :
          "bg-gray-400"
        }`} />
      )}
      {Icon && <Icon size={10} />}
      {label}
    </span>
  );
}
