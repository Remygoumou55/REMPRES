"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { EmployeeContractData } from "@/lib/server/rh";

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
  logoSub: {
    fontSize: 8,
    color: "#888",
    marginTop: 2,
  },
  titleBlock: {
    alignItems: "flex-end",
  },
  contractTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
  },
  contractNum: {
    fontSize: 8,
    color: "#888",
    marginTop: 2,
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  colTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
    paddingBottom: 2,
    borderBottom: "0.5pt solid #eee",
  },
  colRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  colLabel: {
    color: "#888",
    fontSize: 8,
  },
  colValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#222",
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    backgroundColor: "#E6F1FB",
    padding: "3pt 6pt",
    marginBottom: 5,
  },
  clause: {
    fontSize: 8.5,
    color: "#333",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  clauseNum: {
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
  },
  sigRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
    paddingTop: 8,
    borderTop: "0.5pt solid #eee",
  },
  sigBox: {
    flex: 1,
    alignItems: "center",
  },
  sigTitle: {
    fontSize: 8,
    color: "#888",
    marginBottom: 20,
  },
  sigLine: {
    borderBottom: "1pt solid #ccc",
    width: "80%",
    marginBottom: 4,
  },
  sigName: {
    fontSize: 8,
    color: "#555",
  },
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

function formatGnf(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} GNF`;
}

type Props = {
  data: EmployeeContractData;
  companyName?: string;
  directorName?: string;
};

export default function ContratPDF({
  data,
  companyName = "RemPres Ltd",
  directorName = "Rémy Goumou",
}: Props) {
  const durationLabel =
    data.contract_type === "CDI" ? "indéterminée" : "déterminée";

  return (
    <Document title={`Contrat ${data.contract_number}`} author="RemPres ERP">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RemPres</Text>
            <Text style={styles.logoSub}>Conakry, République de Guinée</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.contractTitle}>CONTRAT DE TRAVAIL</Text>
            <Text style={styles.contractNum}>
              N° {data.contract_number}
              {"  ·  "}
              {formatDate(data.generated_at)}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colTitle}>Employeur</Text>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Société</Text>
              <Text style={styles.colValue}>{companyName}</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Adresse</Text>
              <Text style={styles.colValue}>Conakry, Guinée</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Représentant</Text>
              <Text style={styles.colValue}>{directorName}</Text>
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.colTitle}>Employé(e)</Text>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Nom complet</Text>
              <Text style={styles.colValue}>{data.full_name}</Text>
            </View>
            <View style={styles.colRow}>
              <Text style={styles.colLabel}>Poste</Text>
              <Text style={styles.colValue}>{data.position}</Text>
            </View>
            {data.department ? (
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Département</Text>
                <Text style={styles.colValue}>{data.department}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conditions du contrat</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Type de contrat</Text>
                <Text style={styles.colValue}>{data.contract_type}</Text>
              </View>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Date d&apos;embauche</Text>
                <Text style={styles.colValue}>{formatDate(data.hire_date)}</Text>
              </View>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Période d&apos;essai</Text>
                <Text style={styles.colValue}>{data.trial_period_months} mois</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Salaire mensuel</Text>
                <Text style={styles.colValue}>{formatGnf(data.salary_gnf)}</Text>
              </View>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Horaires</Text>
                <Text style={styles.colValue}>
                  {data.work_hours_per_week}h / semaine
                </Text>
              </View>
              <View style={styles.colRow}>
                <Text style={styles.colLabel}>Lieu de travail</Text>
                <Text style={styles.colValue}>{data.work_location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clauses contractuelles</Text>
          <Text style={styles.clause}>
            <Text style={styles.clauseNum}>1. Durée : </Text>
            Le présent contrat est conclu pour une durée {durationLabel} à compter de
            la date d&apos;embauche mentionnée ci-dessus.
          </Text>
          <Text style={styles.clause}>
            <Text style={styles.clauseNum}>2. Fonctions : </Text>
            L&apos;employé(e) exercera les fonctions de {data.position} et toutes
            missions connexes définies par sa hiérarchie.
          </Text>
          <Text style={styles.clause}>
            <Text style={styles.clauseNum}>3. Rémunération : </Text>
            L&apos;employé(e) percevra une rémunération mensuelle brute de{" "}
            {formatGnf(data.salary_gnf)}, versée à terme échu.
          </Text>
          <Text style={styles.clause}>
            <Text style={styles.clauseNum}>4. Confidentialité : </Text>
            L&apos;employé(e) s&apos;engage à maintenir la stricte confidentialité de
            toutes les informations commerciales, financières et techniques de
            l&apos;entreprise.
          </Text>
          <Text style={styles.clause}>
            <Text style={styles.clauseNum}>5. Résiliation : </Text>
            Le présent contrat peut être résilié conformément aux dispositions du Code
            du Travail de la République de Guinée.
          </Text>
        </View>

        <View style={styles.sigRow}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Pour l&apos;employeur</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{directorName} — Directeur</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>L&apos;employé(e) — Lu et approuvé</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{data.full_name}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré par RemPres ERP
          {"  ·  "}
          Confidentiel — Usage interne uniquement
          {"  ·  "}
          {data.contract_number}
        </Text>
      </Page>
    </Document>
  );
}
