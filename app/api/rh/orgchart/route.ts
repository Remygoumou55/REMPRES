import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadEmployeeDomain } from "@/modules/hr/employees/server/security/access";
import { getEmployeeDomainSnapshot } from "@/modules/hr/employees/server/services/employee-service";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadEmployeeDomain(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snapshot = await getEmployeeDomainSnapshot();
  return NextResponse.json({
    orgChart: snapshot.orgChart,
    hierarchyTree: snapshot.hierarchyTree,
  });
}

