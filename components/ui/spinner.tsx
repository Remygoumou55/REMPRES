import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: number;
  className?: string;
  label?: string;
};

export function Spinner({ size = 16, className, label }: SpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
      <Loader2 size={size} className="animate-spin" />
      {label ? <span className="text-sm">{label}</span> : null}
    </span>
  );
}
