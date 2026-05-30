"use client";

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Quote, QuoteStatus } from "@/lib/server/quotes";

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
  converted: "Converti en vente",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#222",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottom: "2pt solid #0E4A8A",
  },
  logoText: {
    fontSize: 16,
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
  docTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
  },
  docNum: {
    fontSize: 9,
    color: "#555",
    marginTop: 3,
  },
  docDate: {
    fontSize: 8,
    color: "#888",
    marginTop: 2,
  },
  docValid: {
    fontSize: 8,
    color: "#633806",
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },
  partiesRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
  },
  partyBox: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 4,
    padding: 8,
    border: "0.5pt solid #E0E0E0",
  },
  partyTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottom: "0.5pt solid #ddd",
  },
  partyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1.5,
  },
  partyLabel: {
    fontSize: 8,
    color: "#888",
  },
  partyValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#222",
    maxWidth: "65%",
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0E4A8A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: "#E6F1FB",
    padding: "3pt 7pt",
    marginBottom: 0,
  },
  tableContainer: {
    marginBottom: 12,
    border: "0.5pt solid #E0E0E0",
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0E4A8A",
    padding: "5pt 7pt",
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5pt 7pt",
    borderTop: "0.5pt solid #F0F0F0",
  },
  tableRowAlt: {
    backgroundColor: "#F9F9F9",
  },
  tableCell: {
    fontSize: 8.5,
    color: "#333",
  },
  tableCellBold: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#222",
  },
  colProduct: { flex: 3 },
  colQty: { width: 35, textAlign: "right" },
  colPrice: { width: 75, textAlign: "right" },
  colDisc: { width: 40, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  totalsContainer: {
    alignItems: "flex-end",
    marginBottom: 12,
    paddingRight: 0,
  },
  totalsBox: {
    width: 200,
    border: "0.5pt solid #E0E0E0",
    borderRadius: 2,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "4pt 8pt",
    borderTop: "0.5pt solid #F0F0F0",
  },
  totalLabel: {
    fontSize: 8,
    color: "#666",
  },
  totalValue: {
    fontSize: 8,
    color: "#333",
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "6pt 8pt",
    backgroundColor: "#0E4A8A",
  },
  totalFinalLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalFinalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  notesContainer: {
    marginBottom: 12,
    padding: 8,
    border: "0.5pt solid #E0E0E0",
    borderRadius: 2,
    backgroundColor: "#FAFAFA",
  },
  notesTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8.5,
    color: "#444",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTop: "0.5pt solid #E0E0E0",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7,
    color: "#999",
  },
  footerRight: {
    fontSize: 7,
    color: "#999",
    textAlign: "right",
  },
});

function formatGnf(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} GNF`;
}

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

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

type Props = {
  quote: Quote;
  companyName?: string;
  companyAddress?: string;
};

export default function QuotePDF({
  quote,
  companyName = "RemPres Ltd",
  companyAddress = "Conakry, République de Guinée",
}: Props) {
  const statusLabel = QUOTE_STATUS_LABELS[quote.status] ?? quote.status;

  return (
    <Document
      title={`Devis ${quote.quote_number}`}
      author="RemPres ERP"
      subject="Devis commercial"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>RemPres</Text>
            <Text style={styles.logoSub}>{companyAddress}</Text>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.docTitle}>DEVIS COMMERCIAL</Text>
            <Text style={styles.docNum}>N° {quote.quote_number}</Text>
            <Text style={styles.docDate}>
              Date : {formatDate(quote.created_at)}
            </Text>
            {quote.valid_until ? (
              <Text style={styles.docValid}>
                Valide jusqu&apos;au : {formatDateShort(quote.valid_until)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Émetteur</Text>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Société</Text>
              <Text style={styles.partyValue}>{companyName}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Adresse</Text>
              <Text style={styles.partyValue}>Conakry, Guinée</Text>
            </View>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Client</Text>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Nom</Text>
              <Text style={styles.partyValue}>{quote.client_name}</Text>
            </View>
            {quote.client_email ? (
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Email</Text>
                <Text style={styles.partyValue}>{quote.client_email}</Text>
              </View>
            ) : null}
            {quote.client_phone ? (
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Téléphone</Text>
                <Text style={styles.partyValue}>{quote.client_phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Articles &amp; Services</Text>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>
              Désignation
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>
              Prix unitaire
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colDisc]}>Rem.</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {quote.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <View style={styles.colProduct}>
                <Text style={styles.tableCellBold}>{item.product_name}</Text>
                {item.description ? (
                  <Text
                    style={[
                      styles.tableCell,
                      { color: "#888", fontSize: 7.5, marginTop: 1 },
                    ]}
                  >
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatGnf(item.unit_price_gnf)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colDisc,
                  item.discount_pct > 0 ? { color: "#E24B4A" } : {},
                ]}
              >
                {item.discount_pct > 0 ? `${item.discount_pct}%` : "—"}
              </Text>
              <Text style={[styles.tableCellBold, styles.colTotal]}>
                {formatGnf(item.line_total_gnf)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total</Text>
              <Text style={styles.totalValue}>
                {formatGnf(quote.subtotal_gnf)}
              </Text>
            </View>
            {quote.discount_gnf > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise globale</Text>
                <Text style={[styles.totalValue, { color: "#E24B4A" }]}>
                  −{formatGnf(quote.discount_gnf)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinalLabel}>TOTAL</Text>
              <Text style={styles.totalFinalValue}>
                {formatGnf(quote.total_gnf)}
              </Text>
            </View>
          </View>
        </View>

        {quote.payment_conditions ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Conditions de paiement</Text>
            <Text style={styles.notesText}>{quote.payment_conditions}</Text>
          </View>
        ) : null}

        {quote.notes ? (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            Document généré par RemPres ERP{"  ·  "}
            {quote.quote_number}
            {"  ·  "}
            Statut : {statusLabel}
          </Text>
          <Text style={styles.footerRight}>
            {quote.valid_until
              ? `Valide jusqu'au ${formatDateShort(quote.valid_until)}`
              : "Sans date de validité"}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
