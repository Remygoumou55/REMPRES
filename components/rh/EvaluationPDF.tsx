"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  CRITERIA_LABELS,
  getOverallLabel,
  SCORE_LABELS,
  type CriteriaKey,
  type PerformanceReview,
} from "@/lib/rh/performance-reviews-shared";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#222",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "1.5pt solid #0E4A8A",
  },
  logoText: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
  },
  logoSub: { fontSize: 8, color: "#888", marginTop: 2 },
  titleBlock: { alignItems: "flex-end" },
  docTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
  },
  docSub: { fontSize: 8, color: "#888", marginTop: 2 },
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 10 },
  col: { flex: 1 },
  colTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#999",
    textTransform: "uppercase",
    marginBottom: 5,
    paddingBottom: 2,
    borderBottom: "0.5pt solid #eee",
  },
  colRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  colLabel: { color: "#888", fontSize: 8 },
  colValue: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#222" },
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
    textTransform: "uppercase",
    backgroundColor: "#E6F1FB",
    padding: "3pt 6pt",
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #eee",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRowBold: {
    flexDirection: "row",
    borderTop: "1pt solid #0E4A8A",
    paddingVertical: 5,
    paddingHorizontal: 4,
    backgroundColor: "#F0F7FF",
  },
  tableCell: { flex: 2, fontSize: 8.5 },
  tableCellScore: { flex: 1, fontSize: 8.5, textAlign: "right" },
  tableCellLabel: { flex: 1, fontSize: 8.5, textAlign: "right" },
  bodyText: { fontSize: 8.5, color: "#333", lineHeight: 1.5 },
  sigRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
    paddingTop: 8,
    borderTop: "0.5pt solid #eee",
  },
  sigBox: { flex: 1, alignItems: "center" },
  sigTitle: { fontSize: 8, color: "#888", marginBottom: 20 },
  sigLine: { borderBottom: "1pt solid #ccc", width: "80%", marginBottom: 4 },
  sigName: { fontSize: 8, color: "#555" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#aaa",
    borderTop: "0.5pt solid #eee",
    paddingTop: 6,
  },
});

const CRITERIA_KEYS: CriteriaKey[] = [
  "score_quality",
  "score_punctuality",
  "score_teamwork",
  "score_initiative",
  "score_objectives",
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

type Props = {
  review: PerformanceReview;
  reviewerName?: string;
};

export default function EvaluationPDF({ review, reviewerName = "Responsable RH" }: Props) {
  const evalNum = `EVAL-${review.id.slice(-4).toUpperCase()}`;
  const overall = Number(review.overall_score);
  const overallLabel = getOverallLabel(overall);

  return (
    <Document title={`Évaluation ${evalNum}`} author="RemPres ERP">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RemPres</Text>
            <Text style={styles.logoSub}>Conakry, République de Guinée</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>ÉVALUATION DE PERFORMANCE</Text>
            <Text style={styles.docSub}>
              N° {evalNum} · {formatDate(review.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Employé(e)</Text>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Nom</Text>
              <Text style={styles.colValue}>{review.employee_name}</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Poste</Text>
              <Text style={styles.colValue}>{review.employee_position}</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Département</Text>
              <Text style={styles.colValue}>{review.employee_department}</Text>
            </View>
          </View>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Évaluation</Text>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Période</Text>
              <Text style={styles.colValue}>{review.period_label}</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Statut</Text>
              <Text style={styles.colValue}>
                {review.status === "finalized" ? "Finalisée" : "Brouillon"}
              </Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Évaluateur</Text>
              <Text style={styles.colValue}>{reviewerName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critères d&apos;évaluation</Text>
          {CRITERIA_KEYS.map((key) => {
            const score = review[key];
            return (
              <View key={key} style={styles.tableRow}>
                <Text style={styles.tableCell}>{CRITERIA_LABELS[key]}</Text>
                <Text style={styles.tableCellScore}>{score}/5</Text>
                <Text style={styles.tableCellLabel}>{SCORE_LABELS[score]}</Text>
              </View>
            );
          })}
          <View style={styles.tableRowBold}>
            <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
              NOTE GLOBALE
            </Text>
            <Text style={[styles.tableCellScore, { fontFamily: "Helvetica-Bold" }]}>
              {overall.toFixed(1)}/5
            </Text>
            <Text style={[styles.tableCellLabel, { fontFamily: "Helvetica-Bold" }]}>
              {overallLabel}
            </Text>
          </View>
        </View>

        {review.comments ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaire général</Text>
            <Text style={styles.bodyText}>{review.comments}</Text>
          </View>
        ) : null}

        {review.objectives_next_period ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs — Période suivante</Text>
            <Text style={styles.bodyText}>{review.objectives_next_period}</Text>
          </View>
        ) : null}

        <View style={styles.sigRow}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>L&apos;évaluateur</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{reviewerName}</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>L&apos;employé(e) — Lu et approuvé</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{review.employee_name}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré par RemPres ERP · Confidentiel · {evalNum}
        </Text>
      </Page>
    </Document>
  );
}
