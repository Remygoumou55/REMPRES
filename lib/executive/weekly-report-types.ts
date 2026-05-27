export type WeeklyReportSection = {
  label: string;
  kpis: { label: string; value: string }[];
  alerts?: string[];
};

export type WeeklyReportData = {
  week: {
    number: number;
    start: string;
    end: string;
    label: string;
    year: number;
  };
  sections: {
    vente: WeeklyReportSection;
    finance: WeeklyReportSection;
    rh: WeeklyReportSection;
    logistique: WeeklyReportSection;
    operations: WeeklyReportSection;
    marketing: WeeklyReportSection;
    formation: WeeklyReportSection;
  };
  highlights: string[];
  generated_at: string;
  generated_by: string;
};
