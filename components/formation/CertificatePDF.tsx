"use client";

export type CertificateData = {
  id: string;
  certificate_number: string;
  issued_at: string;
  valid_until?: string | null;
  score?: number | null;
  grade?: string | null;
  notes?: string | null;
};

export type TraineeData = {
  first_name: string;
  last_name: string;
  email?: string | null;
  company?: string | null;
};

export type TrainingData = {
  title: string;
  duration_hours?: number | null;
  category?: string | null;
};

const PRIMARY = "#0E4A8A";
const SECONDARY = "#2D7CC4";
const SUBTLE = "#888888";
const TEXT = "#333333";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function gradeColor(grade: string | null | undefined): string {
  if (!grade) return SECONDARY;
  const g = grade.toLowerCase();
  if (g.includes("excellent") || g.includes("très bien") || g === "a") return "#059669";
  if (g.includes("bien") || g === "b") return SECONDARY;
  return "#D97706";
}

export async function downloadCertificatePDF(
  certificate: CertificateData,
  trainee: TraineeData,
  training: TrainingData,
): Promise<void> {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import("@react-pdf/renderer");

  const fullName = `${trainee.first_name} ${trainee.last_name}`.trim();
  const issuedLabel = formatDate(certificate.issued_at);
  const validLabel = certificate.valid_until ? formatDate(certificate.valid_until) : "Sans limite";

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF",
      padding: 28,
    },
    outerBorder: {
      flex: 1,
      borderWidth: 4,
      borderColor: PRIMARY,
      borderRadius: 6,
      padding: 6,
    },
    innerBorder: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: SECONDARY,
      borderRadius: 4,
      padding: 32,
      alignItems: "center",
    },
    brand: {
      fontSize: 9,
      color: SECONDARY,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    sep: {
      width: 120,
      height: 2,
      backgroundColor: PRIMARY,
      marginBottom: 14,
    },
    title: {
      fontSize: 22,
      fontFamily: "Helvetica-Bold",
      color: PRIMARY,
      letterSpacing: 1,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 10,
      color: SUBTLE,
      fontStyle: "italic",
      marginBottom: 28,
    },
    labelSmall: {
      fontSize: 9,
      color: SUBTLE,
      marginBottom: 8,
    },
    traineeName: {
      fontSize: 28,
      fontFamily: "Helvetica-Bold",
      color: PRIMARY,
      marginBottom: 16,
      textAlign: "center",
    },
    bodyText: {
      fontSize: 11,
      color: TEXT,
      textAlign: "center",
      marginBottom: 8,
    },
    trainingTitle: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: PRIMARY,
      textAlign: "center",
      marginBottom: 12,
    },
    scoreText: {
      fontSize: 11,
      color: TEXT,
      textAlign: "center",
      marginBottom: 8,
    },
    gradeBox: {
      alignSelf: "center",
      paddingVertical: 4,
      paddingHorizontal: 14,
      backgroundColor: "#E6F1FB",
      borderRadius: 4,
      marginBottom: 20,
    },
    gradeText: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
    },
    detailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: 8,
      marginBottom: 28,
      paddingHorizontal: 12,
    },
    detailCol: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: 8,
    },
    detailLine: {
      width: "80%",
      height: 1,
      backgroundColor: "#CCCCCC",
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 8,
      color: SUBTLE,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 9,
      color: TEXT,
      textAlign: "center",
    },
    certNumber: {
      fontFamily: "Courier",
      fontSize: 9,
    },
    sigRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginTop: "auto",
      paddingTop: 20,
    },
    sigBox: {
      width: "42%",
      alignItems: "center",
    },
    sigLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: TEXT,
      marginBottom: 32,
    },
    sigLine: {
      width: "100%",
      height: 1,
      backgroundColor: "#999999",
    },
    stamp: {
      width: 90,
      height: 50,
      backgroundColor: PRIMARY,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    stampText: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#FFFFFF",
    },
    footerNote: {
      fontSize: 7,
      color: SUBTLE,
      textAlign: "center",
      marginTop: 16,
    },
  });

  const doc = (
    <Document
      title={`Certificat — ${fullName} — ${training.title}`}
      author="RemPres ERP"
      subject="Certificat de formation"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            <Text style={styles.brand}>RemPres ERP</Text>
            <View style={styles.sep} />
            <Text style={styles.title}>CERTIFICAT DE FORMATION</Text>
            <Text style={styles.subtitle}>Certificate of Completion</Text>

            <Text style={styles.labelSmall}>Décerné à</Text>
            <Text style={styles.traineeName}>{fullName}</Text>

            <Text style={styles.bodyText}>
              Pour avoir complété avec succès la formation
            </Text>
            <Text style={styles.trainingTitle}>{training.title}</Text>

            {certificate.score != null ? (
              <Text style={styles.scoreText}>
                avec une note de {Math.round(certificate.score)}/100
              </Text>
            ) : null}
            {certificate.grade ? (
              <View style={[styles.gradeBox, { backgroundColor: "#E6F1FB" }]}>
                <Text style={[styles.gradeText, { color: gradeColor(certificate.grade) }]}>
                  {certificate.grade}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailsRow}>
              <View style={styles.detailCol}>
                <View style={styles.detailLine} />
                <Text style={styles.detailLabel}>{"Date d\u2019émission"}</Text>
                <Text style={styles.detailValue}>{issuedLabel}</Text>
              </View>
              <View style={styles.detailCol}>
                <View style={styles.detailLine} />
                <Text style={styles.detailLabel}>N° Certificat</Text>
                <Text style={[styles.detailValue, styles.certNumber]}>
                  {certificate.certificate_number}
                </Text>
              </View>
              <View style={styles.detailCol}>
                <View style={styles.detailLine} />
                <Text style={styles.detailLabel}>{"Valide jusqu\u2019au"}</Text>
                <Text style={styles.detailValue}>{validLabel}</Text>
              </View>
            </View>

            <View style={styles.sigRow}>
              <View style={styles.sigBox}>
                <Text style={styles.sigLabel}>Directeur de la Formation</Text>
                <View style={styles.sigLine} />
              </View>
              <View style={styles.sigBox}>
                <Text style={styles.sigLabel}>Cachet RemPres ERP</Text>
                <View style={styles.stamp}>
                  <Text style={styles.stampText}>RemPres</Text>
                </View>
              </View>
            </View>

            <Text style={styles.footerNote}>
              Ce certificat a été généré automatiquement par RemPres ERP
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `certificat-${certificate.certificate_number.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
