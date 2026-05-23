import { getErpObservabilitySnapshot } from "@/lib/erp-core/observability/runtime/observability-runtime";
import {
  observabilityJson,
  resolveObservabilityRequest,
} from "@/lib/erp-core/observability/api/observability-request";

export async function GET() {
  const ctx = await resolveObservabilityRequest();
  if (!ctx.ok) return ctx.response;
  const snapshot = getErpObservabilitySnapshot(ctx.scope, {
    eventLimit: 0,
    notificationLimit: 0,
    automationLimit: 50,
  });
  return observabilityJson({ automation: snapshot.recentAutomation });
}
