/** Contrat minimal pour brancher exports CSV/PDF existants (finance, RH) sans nouveau pipeline. */
export type DashboardExportSurface = "dept_kpis" | "finance_snapshot" | "rh_reporting";

export type DashboardExportRequest = {
  surface: DashboardExportSurface;
  correlationId: string;
  params?: Record<string, string | number | boolean | null>;
};
