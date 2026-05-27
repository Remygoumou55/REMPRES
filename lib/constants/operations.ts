export const TASK_STATUS_LABELS = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "En pause",
  done: "Terminé",
  cancelled: "Annulé",
} as const;

export const TASK_STATUS_COLORS: Record<
  keyof typeof TASK_STATUS_LABELS,
  { bg: string; text: string }
> = {
  todo: { bg: "#F1EFE8", text: "#444441" },
  in_progress: { bg: "#FAEEDA", text: "#633806" },
  blocked: { bg: "#E6F1FB", text: "#0C447C" },
  done: { bg: "#EAF3DE", text: "#27500A" },
  cancelled: { bg: "#FCEBEB", text: "#791F1F" },
};

export const TASK_PRIORITY_LABELS = {
  low: "Basse",
  normal: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
} as const;

export const TASK_PRIORITY_COLORS: Record<
  keyof typeof TASK_PRIORITY_LABELS,
  { bg: string; text: string }
> = {
  low: { bg: "#F1EFE8", text: "#444441" },
  normal: { bg: "#E6F1FB", text: "#0C447C" },
  high: { bg: "#FAEEDA", text: "#633806" },
  urgent: { bg: "#FCEBEB", text: "#791F1F" },
};

export const PROJECT_STATUS_LABELS = {
  draft: "Brouillon",
  active: "En cours",
  on_hold: "En pause",
  completed: "Terminé",
  archived: "Archivé",
} as const;

export const PROJECT_STATUS_COLORS: Record<
  keyof typeof PROJECT_STATUS_LABELS,
  { bg: string; text: string }
> = {
  draft: { bg: "#F1EFE8", text: "#444441" },
  active: { bg: "#EAF3DE", text: "#27500A" },
  on_hold: { bg: "#E6F1FB", text: "#0C447C" },
  completed: { bg: "#FAEEDA", text: "#633806" },
  archived: { bg: "#FCEBEB", text: "#791F1F" },
};

export type OpsTaskStatus = keyof typeof TASK_STATUS_LABELS;
export type OpsTaskPriority = keyof typeof TASK_PRIORITY_LABELS;
export type OpsProjectStatus = keyof typeof PROJECT_STATUS_LABELS;

/** Transitions autorisées (schéma : blocked = pause métier). */
export const TASK_STATUS_TRANSITIONS: Record<OpsTaskStatus, OpsTaskStatus[]> = {
  todo: ["in_progress", "cancelled"],
  in_progress: ["done", "blocked", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  done: [],
  cancelled: [],
};

const PRIORITY_RANK: Record<OpsTaskPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export function compareTaskPriority(a: OpsTaskPriority, b: OpsTaskPriority): number {
  return PRIORITY_RANK[b] - PRIORITY_RANK[a];
}
