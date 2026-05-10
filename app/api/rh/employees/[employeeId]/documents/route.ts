import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadEmployeeDomain } from "@/modules/hr/employees/server/security/access";
import { listEmployeeDocuments } from "@/modules/hr/employees/server/repositories/documents-repository";
import { validateEmployeeId } from "@/modules/hr/employees/server/validators/employee";

type RouteContext = { params: { employeeId: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadEmployeeDomain(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const employeeId = String(params.employeeId ?? "").trim();
  if (!validateEmployeeId(employeeId)) return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });

  const documents = await listEmployeeDocuments(employeeId);
  return NextResponse.json({ employeeId, documents });
}

