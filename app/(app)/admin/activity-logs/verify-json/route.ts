import { NextResponse } from "next/server";
import { verifyActivityLogsSignedJsonIntegrity } from "@/lib/server/activity-logs";
import { isAdminRole } from "@/lib/server/permissions";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const allowed = await isAdminRole(data.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valid: false, reason: "Corps JSON invalide ou absent." },
      { status: 400 },
    );
  }

  const result = verifyActivityLogsSignedJsonIntegrity(body);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}
