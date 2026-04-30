"use client";

/**
 * app/vente/recu/[saleId]/ReceiptClient.tsx
 * Composant client : rendu PDF dans le navigateur via @react-pdf/renderer.
 *
 * PDFViewer et usePDF doivent être côté client uniquement.
 * Ce composant est importé dans page.tsx avec dynamic({ ssr: false }).
 */

import { PDFViewer, usePDF } from "@react-pdf/renderer";
import { SaleReceipt, type SaleReceiptData } from "@/components/pdf/SaleReceipt";
import { Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { appConfig, getAbsoluteUrl } from "@/lib/config";

interface Props {
  data: SaleReceiptData;
  saleId: string;
}

export function ReceiptClient({ data, saleId }: Props) {
  const fileName = `recu-${data.reference ?? saleId}.pdf`;

  // Construire l'URL absolue du logo pour @react-pdf/renderer (nécessite http/https)
  // On préfère window.location.origin en runtime pour s'adapter à tous les envs
  const logoAbsoluteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${appConfig.logoUrl}`
      : getAbsoluteUrl(appConfig.logoUrl);

  const [instance] = usePDF({
    document: <SaleReceipt data={data} logoUrl={logoAbsoluteUrl} />,
  });

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-graylight">
      {/* ── Barre d'actions ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Retour */}
          <Link
            href="/vente/historique"
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-darktext hover:bg-graylight"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;historique
          </Link>

          {/* Infos reçu */}
          <div className="text-center">
            <p className="text-sm font-semibold text-darktext">
              {data.reference ?? "Reçu de vente"}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(data.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-darktext hover:bg-graylight"
            >
              <Printer size={16} />
              Imprimer
            </button>

            {instance.loading ? (
              <span className="flex items-center gap-2 rounded-lg bg-primary/70 px-4 py-2 text-sm font-medium text-white">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Préparation…
              </span>
            ) : (
              <a
                href={instance.url ?? "#"}
                download={fileName}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Download size={16} />
                Télécharger le reçu PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Aperçu PDF ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-6 print:hidden">
        <PDFViewer
          width="100%"
          height={820}
          showToolbar={false}
          className="rounded-xl border border-gray-200 shadow-md"
        >
          <SaleReceipt data={data} logoUrl={logoAbsoluteUrl} />
        </PDFViewer>
      </div>

      {/* ── Version imprimable (sans la barre) ──────────────────────────── */}
      <div className="hidden print:block">
        {/* Le navigateur gère l'impression du PDF viewer */}
      </div>
    </div>
  );
}
