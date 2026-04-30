/**
 * components/pdf/SaleReceipt.tsx
 * Composant PDF du reçu de vente — @react-pdf/renderer v3
 *
 * Ce composant est un Document PDF pur.
 * Il est importé dans ReceiptClient.tsx via PDFViewer / usePDF.
 * NE PAS ajouter "use client" ici — ce composant est agnostique (server + client).
 */

import {
  Document,
  Page,
  View,
  Text,
  Image as PdfImage,
  StyleSheet,
} from "@react-pdf/renderer";
import { appConfig } from "@/lib/config";
import { formatMoney, type SupportedCurrency } from "@/lib/utils/formatCurrency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaleReceiptItem {
  product_name:     string;
  product_sku:      string | null;
  quantity:         number;
  unit_price_gnf:   number;
  discount_percent: number;
  total_price_gnf:  number;
}

export interface SaleReceiptData {
  reference:        string | null;
  created_at:       string;
  payment_method:   string | null;
  payment_status:   string;
  subtotal:         number;
  discount_percent: number;
  discount_amount:  number;
  total_amount_gnf: number;
  /** Devise affichée lors de la saisie (GNF | XOF | USD | EUR) */
  display_currency: SupportedCurrency;
  /** Taux de change GNF → display_currency au moment de la vente */
  exchange_rate:    number;
  notes:            string | null;
  client_name:      string | null;
  client_phone:     string | null;
  items:            SaleReceiptItem[];
}

// ---------------------------------------------------------------------------
// Couleurs RemPres
// ---------------------------------------------------------------------------

const C = {
  primary:   "#0E4A8A",
  secondary: "#2D7CC4",
  lightGray: "#F4F6F8",
  border:    "#E5E7EB",
  text:      "#1F2937",
  muted:     "#6B7280",
  white:     "#FFFFFF",
  danger:    "#EF4444",
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 44,
    paddingVertical: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: C.text,
    backgroundColor: C.white,
  },

  // ── En-tête ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  brandBlock: { flexDirection: "column", gap: 3 },
  brandLogoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  brandLogo: { width: 36, height: 36, objectFit: "contain" },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 0.5,
  },
  brandTagline: { fontSize: 8, color: C.muted, marginTop: 1 },
  brandContact: { fontSize: 7.5, color: C.muted },

  invoiceBlock: { alignItems: "flex-end" },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  invoiceRef: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginTop: 4,
  },
  invoiceMeta: { fontSize: 8, color: C.muted, marginTop: 2 },

  // ── Section 2 colonnes (client + info paiement) ──────────────────────────
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  metaBox: {
    flex: 1,
    backgroundColor: C.lightGray,
    borderRadius: 4,
    padding: 10,
  },
  metaTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  metaValue: {
    fontSize: 9,
    color: C.text,
    marginBottom: 2,
  },
  metaValueBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.text,
    marginBottom: 2,
  },

  // ── Tableau des articles ──────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.primary,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.lightGray,
  },
  colProduct:  { flex: 3.5 },
  colQty:      { flex: 0.8, textAlign: "right" },
  colPrice:    { flex: 2, textAlign: "right" },
  colDiscount: { flex: 1.2, textAlign: "right" },
  colTotal:    { flex: 2, textAlign: "right" },

  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tdText: {
    fontSize: 8.5,
    color: C.text,
  },
  tdSku: {
    fontSize: 7,
    color: C.muted,
    marginTop: 1,
  },

  // ── Totaux ───────────────────────────────────────────────────────────────
  totalsBlock: {
    marginTop: 16,
    marginLeft: "auto",
    width: 240,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  totalLabel: { fontSize: 8.5, color: C.muted },
  totalValue: { fontSize: 8.5, color: C.text, textAlign: "right" },
  totalDiscount: { fontSize: 8.5, color: C.danger, textAlign: "right" },
  totalSeparator: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginVertical: 6,
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: C.primary,
    borderRadius: 4,
    marginTop: 2,
  },
  totalFinalLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  totalFinalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textAlign: "right",
  },

  // ── Notes ────────────────────────────────────────────────────────────────
  notesBlock: {
    marginTop: 20,
    padding: 10,
    backgroundColor: C.lightGray,
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: { fontSize: 8.5, color: C.text, lineHeight: 1.4 },

  // ── Pied de page ─────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 28,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft:  { fontSize: 7.5, color: C.muted },
  footerRight: { fontSize: 7.5, color: C.muted, textAlign: "right" },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  });
}

function paymentMethodLabel(method: string | null): string {
  const map: Record<string, string> = {
    cash:          "Espèces",
    mobile_money:  "Mobile Money",
    orange_money:  "Orange Money",
    bank_transfer: "Virement bancaire",
    credit:        "Crédit",
    mixed:         "Paiement mixte",
  };
  return method ? (map[method] ?? method) : "—";
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending:   "En attente de paiement",
    paid:      "Payé",
    partial:   "Paiement partiel",
    overdue:   "En retard",
    cancelled: "Annulé",
  };
  return map[status] ?? status;
}

/**
 * Construit la référence du document.
 * Actuellement : référence de vente (VNT-YYYY-NNNN).
 * Future migration : préfixer avec appConfig.invoiceReferencePrefix pour les factures officielles.
 */
function buildDocumentRef(reference: string | null): string {
  return reference ?? "—";
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface SaleReceiptProps {
  data:     SaleReceiptData;
  /** URL absolue du logo (ex: https://monsite.com/logo.png) — optionnel */
  logoUrl?: string;
}

export function SaleReceipt({ data, logoUrl }: SaleReceiptProps) {
  const hasDiscount = data.discount_percent > 0 || data.discount_amount > 0;
  const docRef = buildDocumentRef(data.reference);
  const currency = (data.display_currency as SupportedCurrency) ?? "GNF";
  const rate     = data.exchange_rate ?? 1;

  /** Formate un montant GNF dans la devise d'affichage de la vente */
  function fmt(amountGNF: number): string {
    return formatMoney(amountGNF, currency, rate);
  }

  // Fallback robuste : si logoUrl est vide ou invalide, on n'affiche pas l'image
  // (évite une erreur de rendu PDF en cas de réseau ou chemin incorrect)
  const resolvedLogoUrl = logoUrl && logoUrl.startsWith("http") ? logoUrl : null;

  return (
    <Document
      title={`Reçu ${docRef} — ${appConfig.name}`}
      author={appConfig.name}
      subject="Reçu de vente"
      creator={appConfig.name}
    >
      <Page size="A4" style={s.page}>

        {/* ── EN-TÊTE ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.brandBlock}>
            {/* Logo + nom sur la même ligne si URL absolue valide fournie */}
            <View style={s.brandLogoRow}>
              {resolvedLogoUrl ? (
                <PdfImage src={resolvedLogoUrl} style={s.brandLogo} />
              ) : null}
              <Text style={s.brandName}>{appConfig.name}</Text>
            </View>
            <Text style={s.brandTagline}>{appConfig.tagline}</Text>
            <Text style={s.brandContact}>{appConfig.address}</Text>
            <Text style={s.brandContact}>{appConfig.email}</Text>
          </View>

          <View style={s.invoiceBlock}>
            <Text style={s.invoiceTitle}>Reçu de vente</Text>
            {data.reference && (
              <Text style={s.invoiceRef}>N° {docRef}</Text>
            )}
            <Text style={s.invoiceMeta}>Date : {fmtDate(data.created_at)}</Text>
            <Text style={s.invoiceMeta}>Devise : {currency}</Text>
          </View>
        </View>

        {/* ── CLIENT + PAIEMENT ────────────────────────────────────────── */}
        <View style={s.metaRow}>
          <View style={s.metaBox}>
            <Text style={s.metaTitle}>Client</Text>
            <Text style={s.metaValueBold}>
              {data.client_name ?? "Client de passage"}
            </Text>
            {data.client_phone && (
              <Text style={s.metaValue}>{data.client_phone}</Text>
            )}
          </View>

          <View style={s.metaBox}>
            <Text style={s.metaTitle}>Paiement</Text>
            <Text style={s.metaValueBold}>
              {paymentMethodLabel(data.payment_method)}
            </Text>
            <Text style={s.metaValue}>{statusLabel(data.payment_status)}</Text>
          </View>
        </View>

        {/* ── TABLEAU DES ARTICLES ─────────────────────────────────────── */}
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colProduct]}>Produit</Text>
          <Text style={[s.thText, s.colQty]}>Qté</Text>
          <Text style={[s.thText, s.colPrice]}>Prix unit.</Text>
          <Text style={[s.thText, s.colDiscount]}>Remise</Text>
          <Text style={[s.thText, s.colTotal]}>Total</Text>
        </View>

        {data.items.map((item, idx) => (
          <View
            key={idx}
            style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
          >
            <View style={s.colProduct}>
              <Text style={s.tdText}>{item.product_name}</Text>
              {item.product_sku && (
                <Text style={s.tdSku}>SKU : {item.product_sku}</Text>
              )}
            </View>
            <Text style={[s.tdText, s.colQty]}>{item.quantity}</Text>
            <Text style={[s.tdText, s.colPrice]}>
              {fmt(item.unit_price_gnf)}
            </Text>
            <Text style={[s.tdText, s.colDiscount]}>
              {item.discount_percent > 0 ? `${item.discount_percent}%` : "—"}
            </Text>
            <Text style={[s.tdText, s.colTotal]}>
              {fmt(item.total_price_gnf)}
            </Text>
          </View>
        ))}

        {/* ── TOTAUX ──────────────────────────────────────────────────── */}
        <View style={s.totalsBlock}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Sous-total</Text>
            <Text style={s.totalValue}>{fmt(data.subtotal)}</Text>
          </View>

          {hasDiscount && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                Remise ({data.discount_percent}%)
              </Text>
              <Text style={s.totalDiscount}>
                {"\u2212"} {fmt(data.discount_amount)}
              </Text>
            </View>
          )}

          <View style={s.totalSeparator} />

          <View style={s.totalFinalRow}>
            <Text style={s.totalFinalLabel}>TOTAL</Text>
            <Text style={s.totalFinalValue}>
              {fmt(data.total_amount_gnf)}
            </Text>
          </View>
        </View>

        {/* ── NOTES ───────────────────────────────────────────────────── */}
        {data.notes && (
          <View style={s.notesBlock}>
            <Text style={s.notesTitle}>Notes</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* ── PIED DE PAGE ────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            {appConfig.name} {"\u2014"} {appConfig.address}
          </Text>
          <Text style={s.footerRight}>
            Merci pour votre confiance !
          </Text>
        </View>

      </Page>
    </Document>
  );
}
