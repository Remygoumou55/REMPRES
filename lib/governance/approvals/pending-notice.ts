/** Paramètre d’URL pour ouvrir la modale « approbation en attente » (évite le bandeau d’erreur). */
export const APPROVAL_PENDING_QUERY_PARAM = "approval_pending";

/** Message court renvoyé par les server actions (logs / détection). */
export const APPROVAL_PENDING_ACTION_MESSAGE =
  "Demande transmise au Super Admin pour validation.";

export const APPROVAL_PENDING_NOTICE = {
  title: "Demande transmise pour validation",
  subtitle: "Approbation Super Admin requise",
  body:
    "Votre action sensible a été enregistrée et envoyée au centre d'approbation. Un Super Administrateur doit la valider avant que les modifications ne soient appliquées dans l'application.",
  hint: "Vous serez notifié dès que la décision sera prise. D'ici là, aucune modification définitive n'est effectuée.",
  confirmLabel: "J'ai compris",
} as const;

/** Détecte les messages d’approbation en attente (ancien libellé + nouveau). */
export function isApprovalPendingMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("centre de gouvernance") ||
    m.includes("centre d'approbation") ||
    m.includes("soumise au centre d'approbation") ||
    m.includes("en attente d'approbation") ||
    m.includes("super admin pour validation") ||
    m.includes("demande transmise au super admin")
  );
}

export function appendQueryParam(pathname: string, source: string, key: string, value: string): string {
  const p = new URLSearchParams(source.replace(/^\?/, ""));
  p.delete("success");
  p.delete("error");
  p.set(key, value);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function stripApprovalNoticeParams(pathname: string, source: string): string {
  const p = new URLSearchParams(source.replace(/^\?/, ""));
  p.delete(APPROVAL_PENDING_QUERY_PARAM);
  const err = p.get("error");
  if (err && isApprovalPendingMessage(decodeURIComponent(err))) {
    p.delete("error");
  }
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function withApprovalPendingQuery(pathname: string, search: string): string {
  return appendQueryParam(pathname, search, APPROVAL_PENDING_QUERY_PARAM, "1");
}
