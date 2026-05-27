"use client";

import type { WeeklyReportData } from "@/lib/executive/weekly-report-types";

const PRIMARY = "#0E4A8A";
const AMBER_BG = "#FAEEDA";
const AMBER_TEXT = "#633806";

const SECTION_COLORS: Record<keyof WeeklyReportData["sections"], string> = {
  vente: "#E6F1FB",
  finance: "#EAF3DE",
  rh: "#EEEDFE",
  logistique: "#FAEEDA",
  operations: "#FCEBEB",
  marketing: "#F1EFE8",
  formation: "#E6F1FB",
};

const SECTION_PREFIX: Record<keyof WeeklyReportData["sections"], string> = {
  vente: "◆",
  finance: "◆",
  rh: "◆",
  logistique: "◆",
  operations: "◆",
  marketing: "◆",
  formation: "◆",
};

function formatGeneratedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function downloadWeeklyReport(data: WeeklyReportData): Promise<void> {
  const { Document, Page, Text: PdfText, View: PdfView, StyleSheet, pdf } =
    await import("@react-pdf/renderer");

  const sectionKeys = Object.keys(data.sections) as (keyof WeeklyReportData["sections"])[];

  const styles = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 9, color: "#1F2937" },
    header: {
      backgroundColor: PRIMARY,
      padding: 28,
      marginBottom: 16,
    },
    headerBrand: {
      fontSize: 9,
      color: "#FFFFFF",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontFamily: "Helvetica-Bold",
      color: "#FFFFFF",
      marginTop: 6,
    },
    headerWeek: { fontSize: 12, color: "#FFFFFF", marginTop: 8 },
    headerMeta: { fontSize: 8, color: "#FFFFFF", marginTop: 6, opacity: 0.9 },
    highlights: {
      marginHorizontal: 24,
      marginBottom: 14,
      padding: 12,
      backgroundColor: AMBER_BG,
      borderRadius: 4,
    },
    highlightsTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: AMBER_TEXT,
      marginBottom: 6,
    },
    highlightItem: { fontSize: 8, color: AMBER_TEXT, marginBottom: 3 },
    section: { marginHorizontal: 24, marginBottom: 10 },
    sectionHeader: {
      padding: 6,
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: PRIMARY,
    },
    kpiRow: { flexDirection: "row", flexWrap: "wrap", padding: 8, gap: 8 },
    kpiBox: { width: "48%", marginBottom: 4 },
    kpiLabel: { fontSize: 7, color: "#6B7280" },
    kpiValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 2 },
    alert: { fontSize: 7, color: "#B91C1C", marginTop: 2, paddingHorizontal: 8 },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 24,
      right: 24,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingTop: 8,
    },
    footerText: { fontSize: 7, color: "#6B7280", textAlign: "center" },
  });

  const doc = (
    <Document
      title={`Rapport hebdomadaire — ${data.week.label}`}
      author="RemPres ERP"
    >
      <Page size="A4" style={styles.page}>
        <PdfView style={styles.header}>
          <PdfText style={styles.headerBrand}>RemPres ERP</PdfText>
          <PdfText style={styles.headerTitle}>RAPPORT HEBDOMADAIRE</PdfText>
          <PdfText style={styles.headerWeek}>{data.week.label}</PdfText>
          <PdfText style={styles.headerMeta}>
            Généré le {formatGeneratedDate(data.generated_at)} par {data.generated_by}
          </PdfText>
        </PdfView>

        {data.highlights.length > 0 ? (
          <PdfView style={styles.highlights}>
            <PdfText style={styles.highlightsTitle}>Points d&apos;attention</PdfText>
            {data.highlights.map((h) => (
              <PdfText key={h} style={styles.highlightItem}>
                • {h}
              </PdfText>
            ))}
          </PdfView>
        ) : null}

        {sectionKeys.map((key) => {
          const section = data.sections[key];
          const bg = SECTION_COLORS[key];
          return (
            <PdfView key={key} style={styles.section} wrap={false}>
              <PdfView style={[styles.sectionHeader, { backgroundColor: bg }]}>
                <PdfText>
                  {SECTION_PREFIX[key]} {section.label}
                </PdfText>
              </PdfView>
              <PdfView style={styles.kpiRow}>
                {section.kpis.map((kpi) => (
                  <PdfView key={kpi.label} style={styles.kpiBox}>
                    <PdfText style={styles.kpiLabel}>{kpi.label}</PdfText>
                    <PdfText style={styles.kpiValue}>{kpi.value}</PdfText>
                  </PdfView>
                ))}
              </PdfView>
              {(section.alerts ?? []).map((a) => (
                <PdfText key={a} style={styles.alert}>
                  ⚠ {a}
                </PdfText>
              ))}
            </PdfView>
          );
        })}

        <PdfView style={styles.footer} fixed>
          <PdfText style={styles.footerText}>
            RemPres ERP · Rapport Semaine {data.week.number} · {data.week.year}
          </PdfText>
          <PdfText style={styles.footerText}>
            Confidentiel — Direction Générale
          </PdfText>
        </PdfView>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rempres-rapport-semaine-${data.week.number}-${data.week.year}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
