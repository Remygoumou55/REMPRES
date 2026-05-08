export type RhTimelineInputItem = {
  id: string;
  label: string;
  source: "leave" | "attendance" | "activity";
  createdAt: string;
};

export function buildRhTimeline(items: RhTimelineInputItem[], limit = 12): RhTimelineInputItem[] {
  return [...items]
    .filter((item) => item.id && item.label && item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, Math.max(1, limit));
}

