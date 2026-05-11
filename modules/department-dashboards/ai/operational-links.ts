import type { DepartmentOperationalLink } from "../types/domain";

/** Consoles plateforme IA — visibles depuis tout département (droits admin sur la cible). */
export const AI_OPERATIONAL_LINKS: readonly DepartmentOperationalLink[] = [
  { id: "ai-hub", vertical: "ai", href: "/admin/ai", labelKey: "deptDash.ai.link.hub" },
];
