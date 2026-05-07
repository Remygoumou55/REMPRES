export function AuditTimeline({ createdAt }: { createdAt: string }) {
  return <p className="text-xs text-gray-500">{new Date(createdAt).toLocaleString("fr-FR")}</p>;
}
