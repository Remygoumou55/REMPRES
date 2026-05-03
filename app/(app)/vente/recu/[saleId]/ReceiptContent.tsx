"use client";

/**
 * Contenu lourd du reçu (react-pdf) — chargé via dynamic() depuis ReceiptClient pour réduire le JS initial.
 */

import { PDFViewer, usePDF } from "@react-pdf/renderer";
import { SaleReceipt, type SaleReceiptData } from "@/components/pdf/SaleReceipt";
import { Download, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { appConfig, getAbsoluteUrl } from "@/lib/config";

export type ReceiptContentProps = {
  data: SaleReceiptData;
  saleId: string;
};

export function ReceiptContent({ data, saleId }: ReceiptContentProps) {
  const fileName = `recu-${data.reference ?? saleId}.pdf`;

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
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/vente/historique"
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-darktext hover:bg-graylight"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;historique
          </Link>

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

          <div className="flex items-center gap-2">
            <button
              type="button"
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

      <div className="hidden print:block" />
    </div>
  );
}
