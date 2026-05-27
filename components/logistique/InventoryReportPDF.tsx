"use client";

import type { InventoryLine, InventorySession } from "@/lib/server/inventory";

function fmtQty(n: number): string {
  return Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function lineStatus(line: InventoryLine): {
  label: string;
  color: string;
} {
  if (line.counted_quantity === null) {
    return { label: "Non compté", color: "#9CA3AF" };
  }
  const disc = line.discrepancy ?? 0;
  if (disc === 0) return { label: "Conforme", color: "#059669" };
  if (disc > 0) return { label: `Excédent +${fmtQty(disc)}`, color: "#2563EB" };
  return { label: `Manquant ${fmtQty(disc)}`, color: "#DC2626" };
}

export async function downloadInventoryReport(
  session: InventorySession,
  lines: InventoryLine[],
): Promise<void> {
  const [{ Document, Page, Text, View, StyleSheet, pdf }] = await Promise.all([
    import("@react-pdf/renderer"),
  ]);

  const PRIMARY = "#0E4A8A";
  const generatedAt = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const counted = lines.filter((l) => l.counted_quantity !== null).length;
  const discrepancies = lines.filter(
    (l) => l.discrepancy !== null && l.discrepancy !== 0,
  ).length;

  const styles = StyleSheet.create({
    page: {
      padding: 28,
      fontSize: 9,
      fontFamily: "Helvetica",
      color: "#111827",
    },
    header: {
      marginBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: PRIMARY,
      paddingBottom: 10,
    },
    brand: { fontSize: 11, color: PRIMARY, fontWeight: "bold" },
    title: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
    meta: { fontSize: 8, color: "#6B7280", marginTop: 4 },
    summary: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },
    summaryBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 6,
      padding: 8,
      backgroundColor: "#F9FAFB",
    },
    summaryLabel: { fontSize: 7, color: "#6B7280", textTransform: "uppercase" },
    summaryValue: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: PRIMARY,
      color: "#FFFFFF",
      paddingVertical: 6,
      paddingHorizontal: 4,
      fontWeight: "bold",
      fontSize: 8,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#F3F4F6",
      paddingVertical: 5,
      paddingHorizontal: 4,
      fontSize: 8,
    },
    colProduct: { width: "28%" },
    colSku: { width: "12%" },
    colTheo: { width: "12%", textAlign: "right" },
    colCount: { width: "12%", textAlign: "right" },
    colDisc: { width: "12%", textAlign: "right" },
    colStatus: { width: "24%" },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 28,
      right: 28,
      fontSize: 7,
      color: "#9CA3AF",
      textAlign: "center",
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      paddingTop: 8,
    },
  });

  const InventoryReportDoc = (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>RemPres ERP</Text>
          <Text style={styles.title}>RAPPORT D&apos;INVENTAIRE</Text>
          <Text style={styles.meta}>
            {session.name} • Statut : {session.status} • Généré le {generatedAt}
          </Text>
          {session.validated_at ? (
            <Text style={styles.meta}>
              Validé le{" "}
              {new Date(session.validated_at).toLocaleDateString("fr-FR")}
            </Text>
          ) : null}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Produits comptés</Text>
            <Text style={styles.summaryValue}>
              {counted} / {lines.length}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Écarts détectés</Text>
            <Text style={styles.summaryValue}>{discrepancies}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Session</Text>
            <Text style={styles.summaryValue}>{session.name}</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colProduct}>Produit</Text>
          <Text style={styles.colSku}>SKU</Text>
          <Text style={styles.colTheo}>Stock système</Text>
          <Text style={styles.colCount}>Comptage</Text>
          <Text style={styles.colDisc}>Écart</Text>
          <Text style={styles.colStatus}>Statut</Text>
        </View>

        {lines.map((line) => {
          const st = lineStatus(line);
          return (
            <View key={line.id} style={styles.tableRow}>
              <Text style={styles.colProduct}>{line.product_name}</Text>
              <Text style={styles.colSku}>{line.sku ?? "—"}</Text>
              <Text style={styles.colTheo}>{fmtQty(line.theoretical_quantity)}</Text>
              <Text style={styles.colCount}>
                {line.counted_quantity === null
                  ? "—"
                  : fmtQty(line.counted_quantity)}
              </Text>
              <Text style={styles.colDisc}>
                {line.discrepancy === null ? "—" : fmtQty(line.discrepancy)}
              </Text>
              <Text style={{ ...styles.colStatus, color: st.color }}>{st.label}</Text>
            </View>
          );
        })}

        <Text style={styles.footer} fixed>
          RemPres ERP • Rapport d&apos;inventaire — {session.name} • Généré le{" "}
          {generatedAt}
          {"\n"}Ce rapport est généré automatiquement.
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(InventoryReportDoc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventaire-${session.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
