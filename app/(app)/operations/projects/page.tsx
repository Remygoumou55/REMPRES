import { OperationsProjectsClient } from "@/components/operations/OperationsProjectsClient";
import {
  listOpsProjects,
  listProfilesForAssignment,
} from "@/lib/server/operations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OperationsProjectsPage() {
  const [{ data: projects }, assignableUsers] = await Promise.all([
    listOpsProjects(),
    listProfilesForAssignment(),
  ]);

  return (
    <OperationsProjectsClient
      projects={projects}
      assignableUsers={assignableUsers}
    />
  );
}
