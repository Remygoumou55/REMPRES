import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { getExecutiveGlobalSnapshotService } from "@/modules/executive-dashboard/server";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [admin, superAdmin] = await Promise.all([isAdminRole(user.id), isSuperAdmin(user.id)]);
  if (!admin && !superAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snapshot = await getExecutiveGlobalSnapshotService({
    viewerUserId: user.id,
    elevated: admin || superAdmin,
  });
  return NextResponse.json(snapshot);
}
