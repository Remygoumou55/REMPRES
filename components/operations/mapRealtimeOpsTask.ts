import type { OpsTaskPriority, OpsTaskStatus } from "@/lib/constants/operations";
import type { OpsTask } from "@/lib/server/operations";

type DbOpsTaskRow = {
  id: string;
  task_code?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  due_at?: string | null;
  project_id?: string | null;
  assignee_user_id?: string | null;
  completed_at?: string | null;
  created_by?: string | null;
  created_at?: string;
  deleted_at?: string | null;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOpsTask(row: object): row is OpsTask {
  return "assigned_to" in row && "is_overdue" in row;
}

export function mapDbRowToOpsTask(
  row: DbOpsTaskRow,
  previous?: OpsTask,
): OpsTask {
  const status = (row.status ?? previous?.status ?? "todo") as OpsTaskStatus;
  const dueDate = row.due_at
    ? row.due_at.slice(0, 10)
    : previous?.due_date ?? null;
  const isOverdue =
    !!dueDate &&
    dueDate < todayIsoDate() &&
    status !== "done" &&
    status !== "cancelled";

  return {
    id: row.id,
    task_code: row.task_code ?? previous?.task_code ?? "",
    title: row.title ?? previous?.title ?? "",
    description: row.description ?? previous?.description ?? null,
    status,
    priority: (row.priority ?? previous?.priority ?? "normal") as OpsTaskPriority,
    due_date: dueDate,
    project_id: row.project_id ?? previous?.project_id ?? null,
    project_name: previous?.project_name ?? null,
    assigned_to: row.assignee_user_id ?? previous?.assigned_to ?? null,
    assigned_name: previous?.assigned_name ?? null,
    completed_at: row.completed_at ?? previous?.completed_at ?? null,
    created_by: row.created_by ?? previous?.created_by ?? null,
    created_at: row.created_at ?? previous?.created_at ?? "",
    is_overdue: isOverdue,
  };
}

/** Normalise les lignes Realtime (brutes) vers OpsTask pour le Kanban. */
export function normalizeRealtimeOpsTasks(
  raw: object[],
  seed: OpsTask[],
): OpsTask[] {
  const seedMap = new Map(seed.map((t) => [t.id, t]));
  const result: OpsTask[] = [];

  for (const row of raw) {
    if ("deleted_at" in row && (row as DbOpsTaskRow).deleted_at != null) {
      continue;
    }
    if (isOpsTask(row)) {
      result.push(row);
      continue;
    }
    const db = row as DbOpsTaskRow;
    if (!db.id) continue;
    result.push(mapDbRowToOpsTask(db, seedMap.get(db.id)));
  }

  return result;
}
