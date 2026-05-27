import { OperationsTasksClient } from "@/components/operations/OperationsTasksClient";
import {
  getOpsTaskSummary,
  listOpsProjects,
  listOpsTasks,
  listProfilesForAssignment,
} from "@/lib/server/operations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OperationsTasksPage() {
  const [{ data: tasks }, { data: projects }, assignableUsers, summary] =
    await Promise.all([
      listOpsTasks(),
      listOpsProjects(),
      listProfilesForAssignment(),
      getOpsTaskSummary(),
    ]);

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <OperationsTasksClient
      tasks={tasks}
      projects={projectOptions}
      assignableUsers={assignableUsers}
      summary={summary}
    />
  );
}
