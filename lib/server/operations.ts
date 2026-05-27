import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/database.types";
import { compareTaskPriority } from "@/lib/constants/operations";
import type { OpsProjectStatus, OpsTaskPriority, OpsTaskStatus } from "@/lib/constants/operations";
import {
  assertOpsWriteActionAllowed,
  OPS_WRITE_ACTIONS,
} from "@/lib/operations/runtime/operations-write-governance";
import {
  assignOpsTask,
  createOpsProject as createOpsProjectMutation,
  createOpsTask as createOpsTaskMutation,
  updateOpsTaskStatus as updateOpsTaskStatusMutation,
} from "@/modules/operations/server/services/ops-mutations";

export type OpsTask = {
  id: string;
  task_code: string;
  title: string;
  description: string | null;
  status: OpsTaskStatus;
  priority: OpsTaskPriority;
  due_date: string | null;
  project_id: string | null;
  project_name: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  is_overdue: boolean;
};

export type OpsProject = {
  id: string;
  project_code: string;
  name: string;
  description: string | null;
  status: OpsProjectStatus;
  start_date: string | null;
  end_date: string | null;
  manager_id: string | null;
  manager_name: string | null;
  budget_gnf: number | null;
  budget_reference: string | null;
  task_count: number;
  completed_task_count: number;
  created_at: string;
};

type TaskRow = {
  id: string;
  task_code: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_at: string | null;
  project_id: string | null;
  assignee_user_id: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  deleted_at?: string | null;
  erp_ops_projects?: { title: string } | { title: string }[] | null;
};

type ProjectRow = {
  id: string;
  project_code: string;
  title: string;
  description: string | null;
  status: string;
  owner_user_id: string;
  budget_reference: string | null;
  budget_gnf?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  deleted_at?: string | null;
};

function profileName(
  row: { first_name: string | null; last_name: string | null } | undefined,
): string | null {
  if (!row) return null;
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return name || null;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapTaskRow(
  row: TaskRow,
  profileMap: Map<string, string>,
): OpsTask {
  const projectTitle = Array.isArray(row.erp_ops_projects)
    ? row.erp_ops_projects[0]?.title
    : row.erp_ops_projects?.title;
  const status = row.status as OpsTaskStatus;
  const dueDate = row.due_at ? row.due_at.slice(0, 10) : null;
  const isOverdue =
    !!dueDate &&
    dueDate < todayIsoDate() &&
    status !== "done" &&
    status !== "cancelled";

  return {
    id: row.id,
    task_code: row.task_code,
    title: row.title,
    description: row.description,
    status,
    priority: row.priority as OpsTaskPriority,
    due_date: dueDate,
    project_id: row.project_id,
    project_name: projectTitle ?? null,
    assigned_to: row.assignee_user_id,
    assigned_name: row.assignee_user_id
      ? profileMap.get(row.assignee_user_id) ?? null
      : null,
    completed_at: row.completed_at,
    created_by: row.created_by,
    created_at: row.created_at,
    is_overdue: isOverdue,
  };
}

async function loadProfileNames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,first_name,last_name")
    .in("id", unique)
    .is("deleted_at", null);

  for (const p of data ?? []) {
    const name = profileName(p);
    if (name) map.set(p.id, name);
  }
  return map;
}

export async function listProfilesForAssignment(): Promise<
  { id: string; full_name: string }[]
> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email")
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("first_name", { ascending: true });

  if (error) return [];

  return (data ?? []).map((p) => ({
    id: p.id,
    full_name:
      profileName(p) ?? p.email ?? p.id.slice(0, 8),
  }));
}

export async function listOpsTasks(params?: {
  status?: string;
  priority?: string;
  projectId?: string;
  assignedTo?: string;
}): Promise<{ data: OpsTask[]; total: number }> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("erp_ops_tasks")
    .select(
      "id,task_code,title,description,status,priority,due_at,project_id,assignee_user_id,completed_at,created_by,created_at,deleted_at,erp_ops_projects(title)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("due_at", { ascending: true, nullsFirst: false });

  if (params?.status && params.status !== "all") {
    query = query.eq("status", params.status as OpsTaskStatus);
  }
  if (params?.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority as OpsTaskPriority);
  }
  if (params?.projectId && params.projectId !== "all") {
    query = query.eq("project_id", params.projectId);
  }
  if (params?.assignedTo && params.assignedTo !== "all") {
    if (params.assignedTo === "unassigned") {
      query = query.is("assignee_user_id", null);
    } else {
      query = query.eq("assignee_user_id", params.assignedTo);
    }
  }

  const { data, error, count } = await query.limit(200);
  if (error) {
    console.error("listOpsTasks", error.message);
    return { data: [], total: 0 };
  }

  const rows = (data ?? []) as TaskRow[];
  const profileMap = await loadProfileNames(
    rows.map((r) => r.assignee_user_id).filter(Boolean) as string[],
  );

  const mapped = rows
    .map((r) => mapTaskRow(r, profileMap))
    .sort((a, b) => {
      const p = compareTaskPriority(a.priority, b.priority);
      if (p !== 0) return p;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  return { data: mapped, total: count ?? mapped.length };
}

export async function getOpsTask(id: string): Promise<OpsTask | null> {
  const { data } = await listOpsTasks();
  return data.find((t) => t.id === id) ?? null;
}

export async function createOpsTask(input: {
  title: string;
  description?: string;
  status?: OpsTaskStatus;
  priority?: OpsTaskPriority;
  due_date?: string | null;
  project_id?: string | null;
  assigned_to?: string | null;
  created_by: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const dueAt = input.due_date
      ? new Date(`${input.due_date}T23:59:59`).toISOString()
      : null;

    const row = await createOpsTaskMutation(input.created_by, {
      title: input.title,
      description: input.description ?? null,
      projectId: input.project_id ?? null,
      ownerUserId: input.created_by,
      assigneeUserId: input.assigned_to ?? null,
      priority: input.priority ?? "normal",
      dueAt,
    });

    if (input.status && input.status !== "todo") {
      await updateOpsTaskStatusMutation(
        input.created_by,
        row.id,
        input.status,
      );
    }

    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Création impossible.",
    };
  }
}

export async function updateOpsTask(
  id: string,
  userId: string,
  input: {
    title?: string;
    description?: string;
    status?: OpsTaskStatus;
    priority?: OpsTaskPriority;
    due_date?: string | null;
    project_id?: string | null;
    assigned_to?: string | null;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertOpsWriteActionAllowed(
      userId,
      OPS_WRITE_ACTIONS.TASK_UPDATE,
      "update",
    );

    const supabase = getSupabaseServerClient();
    const payload: Database["public"]["Tables"]["erp_ops_tasks"]["Update"] = {};

    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.description !== undefined) {
      payload.description = input.description?.trim() || null;
    }
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.project_id !== undefined) payload.project_id = input.project_id;
    if (input.assigned_to !== undefined) {
      payload.assignee_user_id = input.assigned_to;
    }
    if (input.due_date !== undefined) {
      payload.due_at = input.due_date
        ? new Date(`${input.due_date}T23:59:59`).toISOString()
        : null;
    }

    if (input.status !== undefined) {
      if (input.status === "done") {
        payload.status = "done";
        payload.completed_at = new Date().toISOString();
        payload.completed_by = userId;
      } else {
        payload.status = input.status;
        payload.completed_at = null;
        payload.completed_by = null;
      }
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await supabase
        .from("erp_ops_tasks")
        .update(payload)
        .eq("id", id)
        .is("deleted_at", null);
      if (error) throw new Error(error.message);
    } else if (input.assigned_to) {
      await assignOpsTask(userId, id, input.assigned_to);
    }

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Mise à jour impossible.",
    };
  }
}

export async function updateOpsTaskStatus(
  taskId: string,
  userId: string,
  newStatus: OpsTaskStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateOpsTaskStatusMutation(userId, taskId, newStatus);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Transition impossible.",
    };
  }
}

export async function deleteOpsTask(
  id: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertOpsWriteActionAllowed(
      userId,
      OPS_WRITE_ACTIONS.TASK_UPDATE,
      "delete",
    );

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("erp_ops_tasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Suppression impossible.",
    };
  }
}

export async function listOpsProjects(): Promise<{
  data: OpsProject[];
  total: number;
}> {
  const supabase = getSupabaseServerClient();

  const { data: projects, error, count } = await supabase
    .from("erp_ops_projects")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("listOpsProjects", error.message);
    return { data: [], total: 0 };
  }

  const rows = (projects ?? []) as ProjectRow[];
  const profileMap = await loadProfileNames(rows.map((r) => r.owner_user_id));

  const { data: taskRows } = await supabase
    .from("erp_ops_tasks")
    .select("project_id,status")
    .is("deleted_at", null)
    .not("project_id", "is", null);

  const counts = new Map<string, { total: number; done: number }>();
  for (const t of taskRows ?? []) {
    if (!t.project_id) continue;
    const cur = counts.get(t.project_id) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (t.status === "done") cur.done += 1;
    counts.set(t.project_id, cur);
  }

  const mapped: OpsProject[] = rows.map((p) => {
    const c = counts.get(p.id) ?? { total: 0, done: 0 };
    return {
      id: p.id,
      project_code: p.project_code,
      name: p.title,
      description: p.description,
      status: p.status as OpsProjectStatus,
      start_date: p.start_date ?? null,
      end_date: p.end_date ?? null,
      manager_id: p.owner_user_id,
      manager_name: profileMap.get(p.owner_user_id) ?? null,
      budget_gnf:
        p.budget_gnf != null ? Number(p.budget_gnf) : null,
      budget_reference: p.budget_reference,
      task_count: c.total,
      completed_task_count: c.done,
      created_at: p.created_at,
    };
  });

  return { data: mapped, total: count ?? mapped.length };
}

export async function createOpsProject(input: {
  name: string;
  description?: string;
  status?: OpsProjectStatus;
  start_date?: string | null;
  end_date?: string | null;
  manager_id?: string | null;
  budget_gnf?: number | null;
  budget_reference?: string | null;
  created_by: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const row = await createOpsProjectMutation(input.created_by, {
      title: input.name,
      description: input.description ?? null,
      ownerUserId: input.manager_id ?? input.created_by,
      budgetReference: input.budget_reference ?? null,
    });

    const supabase = getSupabaseServerClient();
    const extras: Database["public"]["Tables"]["erp_ops_projects"]["Update"] = {};
    if (input.status) extras.status = input.status;
    if (input.start_date !== undefined) extras.start_date = input.start_date;
    if (input.end_date !== undefined) extras.end_date = input.end_date;
    if (input.budget_gnf !== undefined) extras.budget_gnf = input.budget_gnf;

    if (Object.keys(extras).length > 0) {
      await supabase.from("erp_ops_projects").update(extras).eq("id", row.id);
    }

    return { success: true, id: row.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Création impossible.",
    };
  }
}

export async function updateOpsProject(
  id: string,
  userId: string,
  input: {
    name?: string;
    description?: string;
    status?: OpsProjectStatus;
    start_date?: string | null;
    end_date?: string | null;
    manager_id?: string | null;
    budget_gnf?: number | null;
    budget_reference?: string | null;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertOpsWriteActionAllowed(
      userId,
      OPS_WRITE_ACTIONS.PROJECT_UPDATE,
      "update",
    );

    const supabase = getSupabaseServerClient();
    const payload: Database["public"]["Tables"]["erp_ops_projects"]["Update"] = {};
    if (input.name !== undefined) payload.title = input.name.trim();
    if (input.description !== undefined) {
      payload.description = input.description?.trim() || null;
    }
    if (input.status !== undefined) payload.status = input.status;
    if (input.start_date !== undefined) payload.start_date = input.start_date;
    if (input.end_date !== undefined) payload.end_date = input.end_date;
    if (input.manager_id) {
      payload.owner_user_id = input.manager_id;
    }
    if (input.budget_gnf !== undefined) payload.budget_gnf = input.budget_gnf;
    if (input.budget_reference !== undefined) {
      payload.budget_reference = input.budget_reference;
    }

    const { error } = await supabase
      .from("erp_ops_projects")
      .update(payload)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Mise à jour impossible.",
    };
  }
}

export async function deleteOpsProject(
  id: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertOpsWriteActionAllowed(
      userId,
      OPS_WRITE_ACTIONS.PROJECT_UPDATE,
      "delete",
    );

    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("erp_ops_projects")
      .update({
        deleted_at: new Date().toISOString(),
        status: "archived",
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Suppression impossible.",
    };
  }
}

export async function getOpsTaskSummary(): Promise<{
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
}> {
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const [todo, inProgress, done, overdue] = await Promise.all([
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "todo"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "in_progress"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "done"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .lt("due_at", now)
      .not("status", "in", "(done,cancelled)"),
  ]);

  return {
    todo: todo.count ?? 0,
    in_progress: inProgress.count ?? 0,
    done: done.count ?? 0,
    overdue: overdue.count ?? 0,
  };
}
