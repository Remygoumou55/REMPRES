/**
 * B3.2 — Sécurité publish/subscribe (M2 role_key + department_key).
 */

import type { ErpEventEnvelope, ErpEventSensitivity } from "@/lib/erp-core/events/event-contracts";

export class ErpEventSecurityError extends Error {
  constructor(
    message: string,
    readonly code: "event:forbidden_publish" | "event:forbidden_subscribe",
  ) {
    super(message);
    this.name = "ErpEventSecurityError";
  }
}

export type ErpEventPublishContext = {
  actorUserId: string | null;
  departmentKey: string | null;
  roleKey?: string | null;
};

export type ErpEventSubscribeContext = {
  consumerKey: string;
  departmentScope?: string | null;
  roleKey?: string | null;
  maxSensitivity?: ErpEventSensitivity;
};

const SENSITIVITY_RANK: Record<ErpEventSensitivity, number> = {
  public: 0,
  internal: 1,
  restricted: 2,
};

export function assertCanPublishEvent(
  ctx: ErpEventPublishContext,
  event: Pick<ErpEventEnvelope, "departmentKey" | "sensitivity">,
): void {
  if (!ctx.actorUserId && event.sensitivity !== "public") {
    throw new ErpEventSecurityError(
      "Publication événement interne sans acteur interdite.",
      "event:forbidden_publish",
    );
  }

  if (event.departmentKey && ctx.departmentKey) {
    const pub = String(ctx.departmentKey).trim().toUpperCase();
    const evt = String(event.departmentKey).trim().toUpperCase();
    if (pub !== evt && event.sensitivity === "restricted") {
      throw new ErpEventSecurityError(
        "Publication restreinte hors département interdite.",
        "event:forbidden_publish",
      );
    }
  }
}

export function assertCanSubscribe(
  ctx: ErpEventSubscribeContext,
  event: Pick<ErpEventEnvelope, "departmentKey" | "sensitivity">,
): boolean {
  const max = ctx.maxSensitivity ?? "restricted";
  if (SENSITIVITY_RANK[event.sensitivity] > SENSITIVITY_RANK[max]) {
    return false;
  }

  if (ctx.departmentScope && event.departmentKey) {
    const scope = ctx.departmentScope.trim().toUpperCase();
    const evt = event.departmentKey.trim().toUpperCase();
    if (scope !== evt && event.sensitivity !== "public") {
      return false;
    }
  }

  return true;
}
