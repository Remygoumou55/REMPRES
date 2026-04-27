/**
 * app/vente/recu/[saleId]/page.tsx
 * Page serveur : récupère les données de la vente et délègue l'affichage PDF
 * au composant client (PDFViewer ne peut pas s'exécuter côté serveur).
 */

import { redirect, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import type { SaleReceiptData } from "@/components/pdf/SaleReceipt";

// ---------------------------------------------------------------------------
// Import dynamique du composant client (PDFViewer = browser only)
// ---------------------------------------------------------------------------

const ReceiptClient = dynamic(
  () => import("./ReceiptClient").then((m) => m.ReceiptClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-graylight">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">Génération du reçu PDF…</p>
        </div>
      </div>
    ),
  },
);

// ---------------------------------------------------------------------------
// Metadata dynamique
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Reçu de vente" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageProps {
  params: { saleId: string };
}

export default async function ReceiptPage({ params }: PageProps) {
  const { saleId } = params;

  const supabase = getSupabaseServerClient();

  // Auth
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  // Permissions
  const perms = await getModulePermissions(authData.user.id, ["vente", "produits"]);
  if (!perms.canRead) redirect("/access-denied");

  // ── Vente ────────────────────────────────────────────────────────────────
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select("*")
    .eq("id", saleId)
    .is("deleted_at", null)
    .single();

  if (saleError || !sale) return notFound();

  // ── Articles de la vente ─────────────────────────────────────────────────
  const { data: items } = await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", saleId)
    .order("id");

  // ── Client (si présent) ──────────────────────────────────────────────────
  let clientName: string | null = null;
  let clientPhone: string | null = null;

  if (sale.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("client_type, first_name, last_name, company_name, phone")
      .eq("id", sale.client_id)
      .single();

    if (client) {
      clientName =
        client.client_type === "company"
          ? (client.company_name ?? null)
          : [client.first_name, client.last_name].filter(Boolean).join(" ") || null;
      clientPhone = client.phone ?? null;
    }
  }

  // ── Construction du payload PDF ──────────────────────────────────────────
  const receiptData: SaleReceiptData = {
    reference:        sale.reference,
    created_at:       sale.created_at,
    payment_method:   sale.payment_method,
    payment_status:   sale.payment_status,
    subtotal:         Number(sale.subtotal),
    discount_percent: Number(sale.discount_percent),
    discount_amount:  Number(sale.discount_amount),
    total_amount_gnf: Number(sale.total_amount_gnf),
    display_currency: sale.display_currency,
    notes:            sale.notes,
    client_name:      clientName,
    client_phone:     clientPhone,
    items: (items ?? []).map((item) => ({
      product_name:     item.product_name,
      product_sku:      item.product_sku,
      quantity:         item.quantity,
      unit_price_gnf:   Number(item.unit_price_gnf),
      discount_percent: Number(item.discount_percent),
      total_price_gnf:  Number(item.total_price_gnf),
    })),
  };

  return <ReceiptClient data={receiptData} saleId={saleId} />;
}
