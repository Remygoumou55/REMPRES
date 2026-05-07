export function AuditActorCard({
  actorUserId,
  actorRole,
}: {
  actorUserId: string | null;
  actorRole: string | null;
}) {
  return (
    <div className="rounded-xl bg-gray-50 px-2 py-1 text-xs text-gray-600">
      {actorUserId ?? "system"} · {actorRole ?? "unknown_role"}
    </div>
  );
}
