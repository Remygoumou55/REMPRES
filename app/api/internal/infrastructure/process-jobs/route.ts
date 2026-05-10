import { NextResponse } from "next/server";
import { verifyInternalInfrastructureWorker } from "@/modules/infrastructure/server/security/infrastructure-internal-worker-auth";
import { processPendingInfrastructureJobs } from "@/modules/infrastructure/server/services/process-infrastructure-jobs";
import { emitInfrastructureJobBatchMetrics } from "@/modules/infrastructure/monitoring/job-metrics";

export async function POST(request: Request) {
  if (!verifyInternalInfrastructureWorker(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const summary = await processPendingInfrastructureJobs(15);
    emitInfrastructureJobBatchMetrics(summary);
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
