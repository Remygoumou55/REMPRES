/**
 * B3.2 — Registre handlers (subscribe in-process uniquement).
 */

import type {
  ErpEventHandler,
  ErpEventHandlerRegistration,
} from "@/lib/erp-core/events/event-contracts";

const handlers: ErpEventHandlerRegistration[] = [];

function matchPattern(pattern: string, eventType: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -2);
    return eventType === prefix || eventType.startsWith(`${prefix}.`);
  }
  return pattern === eventType;
}

export function registerErpEventHandler(input: {
  pattern: string;
  consumerKey: string;
  handler: ErpEventHandler;
  departmentScope?: string | null;
}): string {
  const id = crypto.randomUUID();
  handlers.push({
    id,
    pattern: input.pattern,
    handler: input.handler,
    consumerKey: input.consumerKey,
    departmentScope: input.departmentScope ?? null,
  });
  return id;
}

export function unregisterErpEventHandler(handlerId: string): void {
  const idx = handlers.findIndex((h) => h.id === handlerId);
  if (idx >= 0) handlers.splice(idx, 1);
}

export function listErpEventHandlers(): readonly ErpEventHandlerRegistration[] {
  return handlers;
}

export function findHandlersForEvent(eventType: string): ErpEventHandlerRegistration[] {
  return handlers.filter((h) => matchPattern(h.pattern, eventType));
}

export function clearErpEventHandlersForTests(): void {
  handlers.length = 0;
}
