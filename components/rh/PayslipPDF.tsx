"use client";

import type { ContractType } from "@/lib/types/rh";

export type PayslipData = {
  id: string;
  month: number;
  year: number;
  salary_gnf: number;
  bonus_gnf: number;
  deductions_gnf: number;
  net_salary_gnf: number;
  days_worked: number;
  days_absent: number;
  leave_days: number;
  notes?: string | null;
  generated_at?: string | null;
};

export type EmployeePayslipData = {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  contract_type: ContractType;
  hire_date: string;
  salary_gnf: number;
};

const MONTH_LABELS: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
  5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
  9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
};

const CONTRACT_LABELS: Record<ContractType, string> = {
  cdi: "CDI", cdd: "CDD", stage: "Stage", freelance: "Freelance",
};

function fmt(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function buildPayslipDocument(payslip: PayslipData, employee: EmployeePayslipData) {
  const generatedAt = payslip.generated_at
    ? new Date(payslip.generated_at).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric",
      });

  return {
    employee,
    payslip,
    generatedAt,
    monthLabel: MONTH_LABELS[payslip.month] ?? String(payslip.month),
    contractLabel: CONTRACT_LABELS[employee.contract_type] ?? employee.contract_type,
  };
}

/**
 * Downloads a payslip PDF using @react-pdf/renderer (dynamic import).
 */
export async function downloadPayslipPDF(
  payslip: PayslipData,
  employee: EmployeePayslipData,
): Promise<void> {
  const [
    { Document, Page, Text, View, StyleSheet, pdf },
  ] = await Promise.all([
    import("@react-pdf/renderer"),
  ]);

  const PRIMARY = "#0E4A8A";
  const LIGHT_BG = "#E6F1FB";
  const GRAY = "#6B7280";

  const styles = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, padding: 36, color: "#1F2937" },

    header: {
      flexDirection: "row", justifyContent: "space-between",
      alignItems: "flex-start", marginBottom: 4,
    },
    headerLeft: { flexDirection: "column" },
    headerBrand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: PRIMARY },
    headerDoc: { fontSize: 11, color: "#374151", marginTop: 2 },
    headerRight: { alignItems: "flex-end" },
    headerPeriodLabel: { fontSize: 9, color: GRAY, textTransform: "uppercase" },
    headerPeriod: { fontSize: 14, fontFamily: "Helvetica-Bold", color: PRIMARY, marginTop: 2 },

    separator: { height: 2, backgroundColor: PRIMARY, marginVertical: 10 },
    thinSep: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },

    section: { marginBottom: 10 },
    sectionTitle: {
      fontSize: 8, fontFamily: "Helvetica-Bold",
      color: PRIMARY, textTransform: "uppercase",
      letterSpacing: 0.8, marginBottom: 6,
    },

    row2: { flexDirection: "row", gap: 16 },
    field: { marginBottom: 4, flex: 1 },
    fieldLabel: { fontSize: 8, color: GRAY },
    fieldValue: { fontSize: 9, color: "#111827", marginTop: 1 },

    table: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 4 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: LIGHT_BG,
      paddingVertical: 6, paddingHorizontal: 10,
    },
    tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PRIMARY },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6, paddingHorizontal: 10,
      borderTopWidth: 1, borderTopColor: "#F3F4F6",
    },
    tableRowNet: {
      flexDirection: "row",
      paddingVertical: 7, paddingHorizontal: 10,
      borderTopWidth: 2, borderTopColor: PRIMARY,
      backgroundColor: "#EFF6FF",
    },
    tableColLabel: { flex: 3 },
    tableColAmount: { flex: 2, textAlign: "right" },
    tableCellLabel: { fontSize: 9, color: "#374151" },
    tableCellAmount: { fontSize: 9, color: "#374151" },
    tableCellNetLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: PRIMARY, flex: 3 },
    tableCellNetAmount: { fontSize: 9, fontFamily: "Helvetica-Bold", color: PRIMARY, flex: 2, textAlign: "right" },

    signatureRow: { flexDirection: "row", marginTop: 24, gap: 32 },
    signatureBox: { flex: 1, alignItems: "center" },
    signatureLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 28 },
    signatureLine: { height: 1, width: "100%", backgroundColor: "#9CA3AF" },
    signatureNote: { fontSize: 8, color: GRAY, marginTop: 4 },

    footer: {
      position: "absolute", bottom: 24, left: 36, right: 36,
      borderTopWidth: 1, borderTopColor: "#E5E7EB",
      paddingTop: 8,
    },
    footerText: { fontSize: 8, color: GRAY, textAlign: "center" },
  });

  const { employee: emp, payslip: ps, generatedAt, monthLabel, contractLabel } = buildPayslipDocument(payslip, employee);

  const doc = (
    <Document
      title={`Bulletin de paie — ${emp.first_name} ${emp.last_name} — ${monthLabel} ${ps.year}`}
      author="RemPres ERP"
      subject="Bulletin de paie"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBrand}>RemPres ERP</Text>
            <Text style={styles.headerDoc}>BULLETIN DE PAIE</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerPeriodLabel}>Période</Text>
            <Text style={styles.headerPeriod}>{monthLabel} {ps.year}</Text>
          </View>
        </View>
        <View style={styles.separator} />

        {/* ── Employé ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations employé</Text>
          <View style={styles.row2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom complet</Text>
              <Text style={styles.fieldValue}>{emp.first_name} {emp.last_name}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Poste</Text>
              <Text style={styles.fieldValue}>{emp.position}</Text>
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Département</Text>
              <Text style={styles.fieldValue}>{emp.department}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Type de contrat</Text>
              <Text style={styles.fieldValue}>{contractLabel}</Text>
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{"Date d\u2019embauche"}</Text>
              <Text style={styles.fieldValue}>{emp.hire_date}</Text>
            </View>
            <View style={styles.field} />
          </View>
        </View>

        <View style={styles.thinSep} />

        {/* ── Période ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Période de paie</Text>
          <View style={styles.row2}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Période</Text>
              <Text style={styles.fieldValue}>{monthLabel} {ps.year}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Jours travaillés</Text>
              <Text style={styles.fieldValue}>{ps.days_worked} j</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Jours absents</Text>
              <Text style={styles.fieldValue}>{ps.days_absent} j</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Jours de congé</Text>
              <Text style={styles.fieldValue}>{ps.leave_days} j</Text>
            </View>
          </View>
          {ps.notes ? (
            <View style={{ marginTop: 4 }}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <Text style={styles.fieldValue}>{ps.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.thinSep} />

        {/* ── Tableau salaire ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Décompte salarial</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableColLabel]}>Rubrique</Text>
              <Text style={[styles.tableHeaderCell, styles.tableColAmount]}>Montant (GNF)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, styles.tableColLabel]}>Salaire de base</Text>
              <Text style={[styles.tableCellAmount, styles.tableColAmount]}>{fmt(ps.salary_gnf)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, styles.tableColLabel]}>Prime / Bonus</Text>
              <Text style={[styles.tableCellAmount, styles.tableColAmount]}>+ {fmt(ps.bonus_gnf)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLabel, styles.tableColLabel]}>Déductions / Retenues</Text>
              <Text style={[styles.tableCellAmount, styles.tableColAmount]}>− {fmt(ps.deductions_gnf)}</Text>
            </View>
            <View style={styles.tableRowNet}>
              <Text style={styles.tableCellNetLabel}>NET À PAYER</Text>
              <Text style={styles.tableCellNetAmount}>{fmt(ps.net_salary_gnf)}</Text>
            </View>
          </View>
        </View>

        {/* ── Signatures ── */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature Employeur</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureNote}>Lu et approuvé</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature Employé</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureNote}>Lu et approuvé</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>RemPres ERP • Document généré le {generatedAt}</Text>
          <Text style={styles.footerText}>Ce document tient lieu de bulletin de paie officiel.</Text>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulletin-paie-${emp.last_name.toLowerCase()}-${ps.year}-${String(ps.month).padStart(2, "0")}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
