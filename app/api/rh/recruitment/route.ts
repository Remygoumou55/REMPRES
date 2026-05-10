import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadRecruitment } from "@/modules/hr/recruitment/server/security/access";
import { getRecruitmentDomainSnapshot } from "@/modules/hr/recruitment/server/services/recruitment-service";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadRecruitment(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const snapshot = await getRecruitmentDomainSnapshot();
  return NextResponse.json(snapshot);
}
