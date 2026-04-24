/**
 * Dépenses — pièces justificatives (Storage Supabase, bucket public).
 * La colonne expenses.receipt_url stocke le chemin relatif dans le bucket
 * (ex. "uuidUser/uuidDepense/facture.pdf"), pas l’URL complète.
 */
export const EXPENSE_RECEIPTS_BUCKET = "expenses-receipts" as const;

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export function validateReceiptFile(file: File): string | null {
  if (file.size > RECEIPT_MAX_BYTES) {
    return "Le fichier dépasse 5 Mo (maximum autorisé).";
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return "Format accepté : PDF ou image (JPEG, PNG, WebP, GIF).";
  }
  return null;
}

export function buildReceiptObjectPath(
  userId: string,
  expenseId: string,
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "document";
  return `${userId}/${expenseId}/${safe}`;
}
