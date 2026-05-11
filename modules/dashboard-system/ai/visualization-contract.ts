/** Couche visualisation IA — données produites par `/admin/ai` / pipelines futurs, rendues dans les widgets. */
export type DashboardAiInsight = {
  id: string;
  title: string;
  summary: string;
  confidence?: number;
  source?: string;
  actions?: { label: string; href: string }[];
};
