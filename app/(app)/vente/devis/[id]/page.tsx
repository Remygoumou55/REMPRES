import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  User,
} from "lucide-react";
import QuoteButton from "@/components/vente/QuoteButton";
import QuoteStatusButton from "@/components/vente/QuoteStatusButton";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  getQuoteById,
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
} from "@/lib/server/quotes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
};

function formatGnf(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} GNF`;
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

function isExpiredDate(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export default async function QuoteDetailPage({ params }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const quote = await getQuoteById(params.id);
  if (!quote) notFound();

  const statusLabel = QUOTE_STATUS_LABELS[quote.status];
  const statusColor = QUOTE_STATUS_COLORS[quote.status];
  const validityExpired =
    quote.valid_until &&
    isExpiredDate(quote.valid_until) &&
    !["accepted", "refused", "expired", "converted"].includes(quote.status);

  return (
    <div className="page-wrapper">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href="/vente/devis"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux devis
        </Link>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-xl font-semibold text-gray-900">
              {quote.quote_number}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Créé le {formatDate(quote.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
              }}
            >
              {statusLabel}
            </span>
            <QuoteButton quote={quote} variant="outline" />
          </div>
        </div>

        <QuoteStatusButton
          quoteId={quote.id}
          currentStatus={quote.status}
          quoteNumber={quote.quote_number}
        />

        {quote.converted_to_sale_id ? (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">
                  Devis converti en vente
                </p>
                <p className="mt-0.5 text-xs text-indigo-600">
                  {quote.converted_at
                    ? `Converti le ${formatDate(quote.converted_at)}`
                    : "Conversion effectuée"}
                </p>
              </div>
            </div>
            <Link
              href={`/vente/historique/${quote.converted_to_sale_id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
            >
              Voir la vente
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : null}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <User className="h-4 w-4" />
              Client
            </h2>
            <p className="font-medium text-gray-900">{quote.client_name}</p>
            {quote.client_email ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <Mail className="h-3 w-3" />
                {quote.client_email}
              </p>
            ) : null}
            {quote.client_phone ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                <Phone className="h-3 w-3" />
                {quote.client_phone}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <Calendar className="h-4 w-4" />
              Informations
            </h2>
            {quote.valid_until ? (
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">Valide jusqu&apos;au</span>
                <span
                  className={
                    validityExpired
                      ? "font-medium text-red-600"
                      : "text-gray-900"
                  }
                >
                  {formatDateShort(quote.valid_until)}
                </span>
              </div>
            ) : null}
            {quote.payment_conditions ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Conditions</span>
                <span className="max-w-[60%] text-right text-gray-900">
                  {quote.payment_conditions}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              <FileText className="h-4 w-4" />
              Articles &amp; Services ({quote.items.length})
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">
                  Désignation
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">
                  Qté
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">
                  Prix unitaire
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">
                  Remise
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, i) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-50 last:border-0 ${
                    i % 2 === 1 ? "bg-gray-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {item.description ? (
                      <p className="text-xs text-gray-400">{item.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {formatGnf(item.unit_price_gnf)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.discount_pct > 0 ? (
                      <span className="text-red-500">-{item.discount_pct}%</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatGnf(item.line_total_gnf)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t border-gray-100 px-4 py-3">
            <div className="w-48">
              <div className="mb-1 flex justify-between text-sm text-gray-600">
                <span>Sous-total</span>
                <span>{formatGnf(quote.subtotal_gnf)}</span>
              </div>
              {quote.discount_gnf > 0 ? (
                <div className="mb-1 flex justify-between text-sm text-red-500">
                  <span>Remise</span>
                  <span>−{formatGnf(quote.discount_gnf)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-semibold text-gray-900">
                <span>TOTAL</span>
                <span>{formatGnf(quote.total_gnf)}</span>
              </div>
            </div>
          </div>
        </div>

        {quote.notes ? (
          <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-medium text-amber-700">Notes</p>
            <p className="text-sm text-amber-800">{quote.notes}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
