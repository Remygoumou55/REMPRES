import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm",
        "outline-none transition placeholder:text-gray-300",
        "focus:border-primary focus:ring-2 focus:ring-primary/15",
        "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400",
        className,
      )}
    />
  );
}
