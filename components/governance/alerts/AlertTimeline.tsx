export function AlertTimeline({
  createdAt,
  resolvedAt,
}: {
  createdAt: string;
  resolvedAt: string | null;
}) {
  return (
    <div className="text-xs text-gray-500">
      <p>Declenchee: {new Date(createdAt).toLocaleString("fr-FR")}</p>
      <p>Resolue: {resolvedAt ? new Date(resolvedAt).toLocaleString("fr-FR") : "-"}</p>
    </div>
  );
}
