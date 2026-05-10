import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadRecruitment } from "@/modules/hr/recruitment/server/security/access";
import { buildRecruitmentReport } from "@/modules/hr/recruitment/reporting/build-recruitment-report";
import { listCandidates } from "@/modules/hr/recruitment/server/repositories/candidates-repository";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadRecruitment(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const candidates = await listCandidates();
  return NextResponse.json(buildRecruitmentReport(candidates));
}
