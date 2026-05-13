import { getExecutiveGlobalSnapshot } from "../repositories";
import { validateExecutiveSnapshot } from "../validators";

export async function getExecutiveGlobalSnapshotService(args: {
  viewerUserId: string;
  elevated: boolean;
}) {
  const snapshot = await getExecutiveGlobalSnapshot(args);
  return validateExecutiveSnapshot(snapshot);
}
