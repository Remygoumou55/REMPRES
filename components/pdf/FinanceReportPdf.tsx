import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { appConfig } from "@/lib/config";
import { formatGNF } from "@/lib/utils/formatCurrency";
import type { FinanceCfoData } from "@/lib/server/finance-overview";

const C = {
  primary: "#0E4A8A",
  border: "#E5E7EB",
  text: "#1F2937",
  muted: "#6B7280",
  white: "#FFFFFF",
  tableHead: "#F4F6F8",
  green: "#059669",
  red: "#E11D48",
};

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: C.text,
  },
  h1: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    marginBottom: 4,
  },
  sub: { fontSize: 8, color: C.muted, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 9, color: C.muted },
  value: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  section: { marginTop: 14, marginBottom: 6, fontSize: 10, fontFamily: "Helvetica-Bold", color: C.primary },
  tableHead: { flexDirection: "row", backgroundColor: C.tableHead, padding: 6, borderRadius: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  cell: { flex: 1, fontSize: 8 },
  cellNum: { flex: 1, fontSize: 8, textAlign: "right" as const },
  foot: { marginTop: 20, fontSize: 7, color: C.muted },
});

export type FinanceReportPdfProps = {
  data: FinanceCfoData;
  from: string;
  to: string;
  generatedAt: string;
  /** Sections visibles (export personnalisé) */
  sections?: { summary: boolean; deltas: boolean; daily: boolean; categories: boolean };
};

const PDF_DEFAULT_SECTIONS: NonNullable<FinanceReportPdfProps["sections"]> = {
  summary: true,
  deltas: true,
  daily: true,
  categories: true,
};

function pct(v: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)} %`;
}

export function FinanceReportPdf({ data, from, to, generatedAt, sections: secIn }: FinanceReportPdfProps) {
  const se = { ...PDF_DEFAULT_SECTIONS, ...secIn };
  const daily = data.cashflowInRange.slice(0, 25);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Rapport financier — {appConfig.name}</Text>
        <Text style={s.sub}>
          Période : {from} → {to} — Généré le {generatedAt} — Données : transactions financières
        </Text>

        {se.summary && (
          <>
            <Text style={s.section}>Indicateurs clés</Text>
            <View style={s.row}>
              <Text style={s.label}>Chiffre d’affaires</Text>
              <Text style={s.value}>{formatGNF(data.totalRevenue)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Dépenses</Text>
              <Text style={s.value}>{formatGNF(data.totalExpenses)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Résultat</Text>
              <Text style={[s.value, { color: data.profit >= 0 ? C.green : C.red }]}>{formatGNF(data.profit)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Marge</Text>
              <Text style={s.value}>
                {data.marginPct == null ? "—" : `${data.marginPct.toFixed(1)} %`}
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Moy. revenu / jour ({data.dayCount} j.)</Text>
              <Text style={s.value}>{formatGNF(data.avgDailyRevenue)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Moy. dépenses / jour</Text>
              <Text style={s.value}>{formatGNF(data.avgDailyExpenses)}</Text>
            </View>
          </>
        )}

        {se.deltas && (
          <>
            <Text style={s.section}>vs période précédente (même durée)</Text>
            <View style={s.row}>
              <Text style={s.label}>Évolution CA</Text>
              <Text style={s.value}>{pct(data.delta.revenuePct)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Évolution dépenses</Text>
              <Text style={s.value}>{pct(data.delta.expensesPct)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Évolution résultat</Text>
              <Text style={s.value}>{pct(data.delta.profitPct)}</Text>
            </View>
          </>
        )}

        {se.daily && (
          <>
            <Text style={s.section}>
              Trésorerie nette (25 premiers jours) — {daily.length} / {data.cashflowInRange.length} lignes
            </Text>
            <View style={s.tableHead}>
              <Text style={s.cell}>Date</Text>
              <Text style={s.cellNum}>Entrées</Text>
              <Text style={s.cellNum}>Sorties</Text>
              <Text style={s.cellNum}>Net</Text>
              <Text style={s.cellNum}>Cumul</Text>
            </View>
            {daily.map((r) => (
              <View key={r.date} style={s.tableRow} wrap={false}>
                <Text style={s.cell}>{r.date}</Text>
                <Text style={s.cellNum}>{formatGNF(r.cashIn)}</Text>
                <Text style={s.cellNum}>{formatGNF(r.cashOut)}</Text>
                <Text style={s.cellNum}>{formatGNF(r.net)}</Text>
                <Text style={s.cellNum}>{formatGNF(r.cumulative)}</Text>
              </View>
            ))}
          </>
        )}

        {se.categories && data.expensesByCategory.length > 0 && (
          <>
            <Text style={s.section}>Dépenses par catégorie</Text>
            <View style={s.tableHead}>
              <Text style={{ ...s.cell, flex: 2 }}>Catégorie</Text>
              <Text style={s.cellNum}>Montant (GNF)</Text>
            </View>
            {data.expensesByCategory.map((c) => (
              <View key={c.categoryId} style={s.tableRow} wrap={false}>
                <Text style={{ ...s.cell, flex: 2 }}>{c.name}</Text>
                <Text style={s.cellNum}>{formatGNF(c.amount)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={s.foot}>
          Document indicatif, basé sur financial_transactions. Montants en GNF. Export personnalisable
          côté application.
        </Text>
      </Page>
    </Document>
  );
}
