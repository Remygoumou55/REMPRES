import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  getWebhookByTokenForIncomingRoute,
  logDelivery,
} from "@/lib/server/webhooks";
import { createNotification } from "@/lib/server/notifications";

type RouteContext = { params: { token: string } };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const t0 = Date.now();
  const token = params.token;

  try {
    const webhook = await getWebhookByTokenForIncomingRoute(token);

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found or inactive" },
        { status: 404 },
      );
    }

    let body: Record<string, unknown> = {};
    const raw = await request.text();
    if (raw) {
      try {
        body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        body = { raw };
      }
    }

    const eventType = String(body.event ?? body.type ?? "unknown");

    await logDelivery(
      {
        webhook_id: webhook.id,
        direction: "incoming",
        event_type: eventType,
        payload: body,
        status: "received",
        duration_ms: Date.now() - t0,
      },
      { serviceRole: true },
    );

    const supabase = getSupabaseServerClient();
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role_key", "super_admin")
      .is("deleted_at", null);

    for (const admin of admins ?? []) {
      await createNotification({
        userId: String(admin.id),
        type: "info",
        title: `Webhook reçu — ${webhook.name}`,
        message: `Événement "${eventType}" reçu via le webhook "${webhook.name}".`,
        actionUrl: "/admin/platform/webhooks",
      }).catch(() => {});
    }

    return NextResponse.json({ received: true, event: eventType }, { status: 200 });
  } catch (err) {
    console.error("[Webhook incoming] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const webhook = await getWebhookByTokenForIncomingRoute(params.token);
  if (!webhook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    status: "active",
    webhook: webhook.name,
  });
}
