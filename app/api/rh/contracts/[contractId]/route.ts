import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadContracts } from "@/modules/hr/contracts/server/security/access";
import { getContractDetails } from "@/modules/hr/contracts/server/services/contract-service";

export async function GET(_: Request, context: { params: Promise<{ contractId: string }> }) {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadContracts(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { contractId } = await context.params;
  const details = await getContractDetails(contractId);
  return NextResponse.json(details);
}

