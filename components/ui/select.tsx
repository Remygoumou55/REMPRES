import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm",
        "outline-none transition",
        "focus:border-primary focus:ring-2 focus:ring-primary/15",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        className,
      )}
    />
  );
}
