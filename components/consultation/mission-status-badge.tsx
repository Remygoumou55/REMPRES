import { memo } from "react";

const STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-800",
  on_hold: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const LABELS: Record<string, string> = {
  draft: "Brouillon",
  active: "Active",
  on_hold: "En pause",
  completed: "Terminée",
  cancelled: "Annulée",
};

type Props = { status: string };

function MissionStatusBadgeInner({ status }: Props) {
  const key = status?.toLowerCase() ?? "draft";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[key] ?? STYLES.draft}`}>
      {LABELS[key] ?? status}
    </span>
  );
}

export const MissionStatusBadge = memo(MissionStatusBadgeInner);
