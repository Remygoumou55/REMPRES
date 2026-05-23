import { getErpObservabilitySnapshot } from "@/lib/erp-core/observability/runtime/observability-runtime";
import {
  observabilityJson,
  resolveObservabilityRequest,
} from "@/lib/erp-core/observability/api/observability-request";

export async function GET() {
  const ctx = await resolveObservabilityRequest();
  if (!ctx.ok) return ctx.response;
  const snapshot = getErpObservabilitySnapshot(ctx.scope);
  return observabilityJson({ snapshot });
}
