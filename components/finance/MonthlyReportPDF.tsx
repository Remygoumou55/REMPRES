"use client";

import type { MonthlyReportData } from "@/lib/server/finance-monthly-report";
import { formatGNF } from "@/lib/utils/formatCurrency";

const PRIMARY = "#0E4A8A";
const GREEN = "#1D9E75";
const RED = "#E24B4A";
const LIGHT_GREEN = "#E8F8F2";
const LIGHT_RED = "#FDECEC";

function fmt(n: number): string {
  return formatGNF(n);
}

function formatGeneratedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function downloadMonthlyReport(data: MonthlyReportData): Promise<void> {
  const { Document, Page, Text: PdfText, View: PdfView, StyleSheet, pdf } =
    await import("@react-pdf/renderer");

  const styles = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 9, padding: 0, color: "#1F2937" },
    header: {
      backgroundColor: PRIMARY,
      padding: 24,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerBrand: { fontSize: 10, color: "#FFFFFF", opacity: 0.9 },
    headerTitle: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: "#FFFFFF",
      marginTop: 4,
    },
    headerRight: { alignItems: "flex-end" },
    headerPeriod: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#FFFFFF",
    },
    headerMeta: { fontSize: 8, color: "#FFFFFF", marginTop: 4, opacity: 0.9 },
    body: { padding: 28 },
    sectionTitle: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      marginTop: 14,
      marginBottom: 6,
    },
    sectionGreen: { color: GREEN },
    sectionRed: { color: RED },
    resultBox: {
      marginTop: 20,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
    },
    resultAmount: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 6 },
    resultLabel: { fontSize: 11, color: "#6B7280" },
    tableHead: {
      flexDirection: "row",
      backgroundColor: "#F4F6F8",
      padding: 6,
      marginTop: 8,
    },
    tableRow: {
      flexDirection: "row",
      padding: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    tableRowHighlight: { backgroundColor: "#EFF6FF" },
    cell: { flex: 1, fontSize: 8 },
    cellNum: { flex: 1, fontSize: 8, textAlign: "right" },
    barRow: { marginBottom: 8 },
    barLabel: { fontSize: 8, marginBottom: 3 },
    barTrack: {
      height: 10,
      backgroundColor: "#E5E7EB",
      borderRadius: 4,
      flexDirection: "row",
      overflow: "hidden",
    },
    barFill: { height: 10, backgroundColor: RED },
    barMeta: { fontSize: 7, color: "#6B7280", marginTop: 2 },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingTop: 8,
    },
    footerText: { fontSize: 7, color: "#6B7280", textAlign: "center" },
  });

  const netPositive = data.result.net_gnf >= 0;
  const currentMonthKey = `${data.period.year}-${String(data.period.month).padStart(2, "0")}`;
  const topCategories = data.expenses.by_category.slice(0, 5);
  const maxCat = topCategories[0]?.total_gnf ?? 1;

  const doc = (
    <Document
      title={`Bilan financier — ${data.period.label}`}
      author="RemPres ERP"
      subject="Bilan financier mensuel"
    >
      <Page size="A4" style={styles.page}>
        <PdfView style={styles.header}>
          <PdfView>
            <PdfText style={styles.headerBrand}>RemPres ERP</PdfText>
            <PdfText style={styles.headerTitle}>BILAN FINANCIER MENSUEL</PdfText>
          </PdfView>
          <PdfView style={styles.headerRight}>
            <PdfText style={styles.headerPeriod}>{data.period.label}</PdfText>
            <PdfText style={styles.headerMeta}>
              Généré le {formatGeneratedDate(data.generated_at)}
            </PdfText>
            <PdfText style={styles.headerMeta}>
              Généré par : {data.generated_by_name}
            </PdfText>
          </PdfView>
        </PdfView>

        <PdfView style={styles.body}>
          <PdfText style={[styles.sectionTitle, styles.sectionGreen]}>REVENUS</PdfText>
          <PdfView style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 4 }}>
            <PdfView style={{ flexDirection: "row", justifyContent: "space-between", padding: 6 }}>
              <PdfText style={{ fontSize: 9 }}>Ventes validées</PdfText>
              <PdfText style={{ fontSize: 9 }}>{fmt(data.revenue.sales_gnf)}</PdfText>
            </PdfView>
            <PdfView style={{ flexDirection: "row", justifyContent: "space-between", padding: 6, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
              <PdfText style={{ fontSize: 9 }}>Autres revenus</PdfText>
              <PdfText style={{ fontSize: 9 }}>{fmt(data.revenue.other_gnf)}</PdfText>
            </PdfView>
            <PdfView style={{ flexDirection: "row", justifyContent: "space-between", padding: 8, backgroundColor: LIGHT_GREEN }}>
              <PdfText style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>TOTAL REVENUS</PdfText>
              <PdfText style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{fmt(data.revenue.total_gnf)}</PdfText>
            </PdfView>
          </PdfView>

          <PdfText style={[styles.sectionTitle, styles.sectionRed]}>DÉPENSES</PdfText>
          <PdfView style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 4 }}>
            {data.expenses.by_category.length === 0 ? (
              <PdfView style={{ padding: 8 }}>
                <PdfText style={{ fontSize: 9, color: "#6B7280" }}>Aucune dépense sur la période</PdfText>
              </PdfView>
            ) : (
              data.expenses.by_category.map((c) => (
                <PdfView
                  key={c.category}
                  style={{ flexDirection: "row", justifyContent: "space-between", padding: 5, borderTopWidth: 1, borderTopColor: "#F3F4F6" }}
                >
                  <PdfText style={{ fontSize: 9, flex: 1 }}>{c.category}</PdfText>
                  <PdfText style={{ fontSize: 9, textAlign: "right" }}>
                    {fmt(c.total_gnf)} ({c.percentage} %)
                  </PdfText>
                </PdfView>
              ))
            )}
            <PdfView style={{ flexDirection: "row", justifyContent: "space-between", padding: 8, backgroundColor: LIGHT_RED }}>
              <PdfText style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>TOTAL DÉPENSES</PdfText>
              <PdfText style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{fmt(data.expenses.total_gnf)}</PdfText>
            </PdfView>
          </PdfView>

          <PdfView style={styles.resultBox}>
            <PdfText style={styles.resultLabel}>
              {netPositive ? "Bénéfice net" : "Déficit net"}
            </PdfText>
            <PdfText
              style={[
                styles.resultAmount,
                { color: netPositive ? GREEN : RED },
              ]}
            >
              {fmt(data.result.net_gnf)}
            </PdfText>
            <PdfText style={{ fontSize: 9, color: "#6B7280", marginTop: 6 }}>
              Marge nette : {data.result.margin_pct} %
            </PdfText>
          </PdfView>
        </PdfView>

        <PdfView style={styles.footer} fixed>
          <PdfText style={styles.footerText}>
            RemPres ERP · Bilan {data.period.label} · Généré le{" "}
            {formatGeneratedDate(data.generated_at)}
          </PdfText>
          <PdfText style={styles.footerText}>
            Document confidentiel — usage interne
          </PdfText>
        </PdfView>
      </Page>

      {(data.comparison.length > 0 || topCategories.length > 0) && (
        <Page size="A4" style={[styles.page, { padding: 28 }]}>
          {data.comparison.length > 0 && (
            <>
              <PdfText style={styles.sectionTitle}>COMPARAISON 3 MOIS</PdfText>
              <PdfView style={styles.tableHead}>
                <PdfText style={[styles.cell, { fontFamily: "Helvetica-Bold" }]}>Mois</PdfText>
                <PdfText style={[styles.cellNum, { fontFamily: "Helvetica-Bold" }]}>Revenus</PdfText>
                <PdfText style={[styles.cellNum, { fontFamily: "Helvetica-Bold" }]}>Dépenses</PdfText>
                <PdfText style={[styles.cellNum, { fontFamily: "Helvetica-Bold" }]}>Résultat</PdfText>
              </PdfView>
              {data.comparison.map((row) => {
                const highlight = row.month === currentMonthKey;
                return (
                  <PdfView
                    key={row.month}
                    style={[styles.tableRow, highlight ? styles.tableRowHighlight : {}]}
                  >
                    <PdfText style={styles.cell}>{row.month_label}</PdfText>
                    <PdfText style={styles.cellNum}>{fmt(row.revenue_gnf)}</PdfText>
                    <PdfText style={styles.cellNum}>{fmt(row.expenses_gnf)}</PdfText>
                    <PdfText
                      style={[
                        styles.cellNum,
                        { color: row.net_gnf >= 0 ? GREEN : RED },
                      ]}
                    >
                      {fmt(row.net_gnf)}
                    </PdfText>
                  </PdfView>
                );
              })}
            </>
          )}

          {topCategories.length > 0 && (
            <>
              <PdfText style={[styles.sectionTitle, { marginTop: 16 }]}>
                TOP DÉPENSES PAR CATÉGORIE
              </PdfText>
              {topCategories.map((c) => {
                const widthPct = Math.max(
                  4,
                  Math.round((c.total_gnf / maxCat) * 100),
                );
                return (
                  <PdfView key={c.category} style={styles.barRow}>
                    <PdfText style={styles.barLabel}>{c.category}</PdfText>
                    <PdfView style={styles.barTrack}>
                      <PdfView
                        style={[styles.barFill, { width: `${widthPct}%` }]}
                      />
                    </PdfView>
                    <PdfText style={styles.barMeta}>
                      {c.percentage} % — {fmt(c.total_gnf)}
                    </PdfText>
                  </PdfView>
                );
              })}
            </>
          )}

          <PdfView style={styles.footer} fixed>
            <PdfText style={styles.footerText}>
              RemPres ERP · Bilan {data.period.label} — Page 2
            </PdfText>
          </PdfView>
        </Page>
      )}
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rempres-bilan-${data.period.month}-${data.period.year}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
