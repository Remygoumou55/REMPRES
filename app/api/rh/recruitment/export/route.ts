import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertCanReadRecruitment } from "@/modules/hr/recruitment/server/security/access";
import { listCandidates } from "@/modules/hr/recruitment/server/repositories/candidates-repository";

function csvEscape(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const user = await getServerSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await assertCanReadRecruitment(user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "csv";
  if (format !== "csv") {
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  }

  const candidates = await listCandidates();
  const headers = [
    "id",
    "full_name",
    "email",
    "phone",
    "job_title",
    "department_key",
    "pipeline_stage",
    "source_channel",
    "hired_profile_id",
    "hired_contract_id",
    "updated_at",
  ];
  const lines = [
    headers.join(","),
    ...candidates.map((c) =>
      [
        csvEscape(c.id),
        csvEscape(c.fullName),
        csvEscape(c.email),
        csvEscape(c.phone ?? ""),
        csvEscape(c.jobTitle),
        csvEscape(c.departmentKey ?? ""),
        csvEscape(c.pipelineStage),
        csvEscape(c.sourceChannel),
        csvEscape(c.hiredProfileId ?? ""),
        csvEscape(c.hiredContractId ?? ""),
        csvEscape(c.updatedAt),
      ].join(","),
    ),
  ];
  const body = lines.join("\r\n");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rh-recruitment-export.csv"',
    },
  });
}
