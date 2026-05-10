import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadContracts } from "@/modules/hr/contracts/server/security/access";
import { getContractDomainSnapshot } from "@/modules/hr/contracts/server/services/contract-service";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadContracts(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const snapshot = await getContractDomainSnapshot();
  return NextResponse.json(snapshot);
}

