"use client";

import type { BankReconciliation } from "@/lib/finance/bank-reconciliation-types";
import { formatGNF } from "@/lib/utils/formatCurrency";

const PRIMARY = "#0E4A8A";
const GREEN = "#1D9E75";
const BLUE = "#0E4A8A";

function fmt(n: number): string {
  return formatGNF(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  validated: "Validé",
};

export async function downloadReconciliationPDF(
  rec: BankReconciliation,
  generatedByName: string,
): Promise<void> {
  const { Document, Page, Text: PdfText, View: PdfView, StyleSheet, pdf } =
    await import("@react-pdf/renderer");

  const disc = rec.discrepancy_gnf;
  const hasBank = rec.bank_balance_gnf != null;
  const generatedAt = new Date().toLocaleString("fr-FR");

  const discBg =
    disc === null
      ? "#F3F4F6"
      : disc === 0
        ? "#EAF3DE"
        : disc > 0
          ? "#FAEEDA"
          : "#FCEBEB";
  const discText =
    disc === null
      ? "#6B7280"
      : disc === 0
        ? "#27500A"
        : disc > 0
          ? "#633806"
          : "#791F1F";

  let discLabel = "Écart non calculé";
  if (disc !== null) {
    if (disc === 0) discLabel = "Aucun écart — Conforme ✓";
    else if (disc > 0) discLabel = `+${fmt(disc)} — Excédent`;
    else discLabel = `${fmt(disc)} — Déficit`;
  }

  const styles = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 9, color: "#1F2937" },
    header: {
      backgroundColor: PRIMARY,
      padding: 24,
      marginBottom: 20,
    },
    headerBrand: { fontSize: 10, color: "#FFFFFF" },
    headerTitle: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: "#FFFFFF",
      marginTop: 4,
    },
    headerMeta: { fontSize: 8, color: "#FFFFFF", marginTop: 6 },
    compareRow: { flexDirection: "row", gap: 16, paddingHorizontal: 28 },
    col: { flex: 1, borderWidth: 2, borderRadius: 6, padding: 14 },
    colBlue: { borderColor: BLUE },
    colGreen: { borderColor: GREEN },
    colLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 6 },
    colAmount: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
    colNote: { fontSize: 7, color: "#6B7280" },
    discBox: {
      marginHorizontal: 28,
      marginTop: 20,
      padding: 16,
      borderRadius: 6,
      alignItems: "center",
    },
    discTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
    discAmount: { fontSize: 14, fontFamily: "Helvetica-Bold" },
    meta: { marginHorizontal: 28, marginTop: 16 },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 28,
      right: 28,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingTop: 8,
    },
    footerText: { fontSize: 7, color: "#6B7280", textAlign: "center" },
  });

  const doc = (
    <Document
      title={`Rapprochement bancaire — ${rec.period_label}`}
      author="RemPres ERP"
    >
      <Page size="A4" style={styles.page}>
        <PdfView style={styles.header}>
          <PdfText style={styles.headerBrand}>RemPres ERP</PdfText>
          <PdfText style={styles.headerTitle}>
            RAPPORT DE RAPPROCHEMENT BANCAIRE
          </PdfText>
          <PdfText style={styles.headerMeta}>Période : {rec.period_label}</PdfText>
          <PdfText style={styles.headerMeta}>
            Généré le {generatedAt} — par {generatedByName}
          </PdfText>
        </PdfView>

        <PdfView style={styles.compareRow}>
          <PdfView style={[styles.col, styles.colBlue]}>
            <PdfText style={[styles.colLabel, { color: BLUE }]}>
              Solde Système
            </PdfText>
            <PdfText style={[styles.colAmount, { color: BLUE }]}>
              {fmt(rec.system_balance_gnf)}
            </PdfText>
            <PdfText style={styles.colNote}>
              Solde calculé par RemPres — basé sur les transactions enregistrées
            </PdfText>
          </PdfView>
          <PdfView style={[styles.col, styles.colGreen]}>
            <PdfText style={[styles.colLabel, { color: GREEN }]}>
              Solde Bancaire
            </PdfText>
            <PdfText style={[styles.colAmount, { color: GREEN }]}>
              {hasBank ? fmt(rec.bank_balance_gnf!) : "Non renseigné"}
            </PdfText>
            <PdfText style={styles.colNote}>
              Solde relevé bancaire — saisi manuellement
            </PdfText>
          </PdfView>
        </PdfView>

        <PdfView style={[styles.discBox, { backgroundColor: discBg }]}>
          <PdfText style={[styles.discTitle, { color: discText }]}>Écart</PdfText>
          <PdfText style={[styles.discAmount, { color: discText }]}>
            {discLabel}
          </PdfText>
        </PdfView>

        <PdfView style={styles.meta}>
          <PdfText style={{ fontSize: 9 }}>
            Statut : {STATUS_LABELS[rec.status] ?? rec.status}
          </PdfText>
          {rec.validated_at ? (
            <PdfText style={{ fontSize: 8, color: "#6B7280", marginTop: 4 }}>
              Validé le {formatDate(rec.validated_at)}
            </PdfText>
          ) : null}
          {rec.notes ? (
            <PdfText style={{ fontSize: 8, marginTop: 8 }}>
              Notes : {rec.notes}
            </PdfText>
          ) : null}
        </PdfView>

        <PdfView style={styles.footer} fixed>
          <PdfText style={styles.footerText}>
            RemPres ERP · Rapprochement {rec.period_label}
          </PdfText>
          <PdfText style={styles.footerText}>
            Document confidentiel — usage interne
          </PdfText>
        </PdfView>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rempres-rapprochement-${rec.month}-${rec.year}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
