"use client";

/**
 * Coquille minimale : le bundle react-pdf est chargé uniquement avec ReceiptContent.
 */

import dynamic from "next/dynamic";
import type { SaleReceiptData } from "@/components/pdf/SaleReceipt";

const ReceiptContent = dynamic(
  () => import("./ReceiptContent").then((m) => m.ReceiptContent),
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

type Props = {
  data: SaleReceiptData;
  saleId: string;
};

export function ReceiptClient({ data, saleId }: Props) {
  return <ReceiptContent data={data} saleId={saleId} />;
}
