import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon:        LucideIcon;
  title:       string;
  description: string;
  action?:     React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Icon size={24} className="text-gray-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-gray-700">{title}</p>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
