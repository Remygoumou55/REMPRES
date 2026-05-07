/**
 * Mapping unifié des erreurs callback/auth invitation.
 */

export function mapAuthCallbackError(error?: string | null, description?: string | null): string {
  const text = `${error ?? ""} ${description ?? ""}`.toLowerCase();

  if (
    text.includes("expired") ||
    text.includes("expir") ||
    text.includes("otp_expired")
  ) {
    return "Invitation expirée";
  }
  if (
    text.includes("used") ||
    text.includes("already") ||
    text.includes("redeemed") ||
    text.includes("consumed")
  ) {
    return "Invitation déjà utilisée";
  }
  if (text.includes("invalid") || text.includes("malformed") || text.includes("bad_code")) {
    return "Lien invalide";
  }

  return "Erreur lors de l'invitation";
}

export function buildAuthErrorHref(message: string): string {
  return `/auth/error?message=${encodeURIComponent(message)}`;
}
