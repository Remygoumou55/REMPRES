export function mapClientError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const raw = error.message.toLowerCase();

  if (raw.includes("accès refusé")) {
    return "Accès refusé: vous n'avez pas la permission pour cette action.";
  }

  if (raw.includes("id client invalide")) {
    return "Le client sélectionné est invalide.";
  }

  if (raw.includes("email invalide")) {
    return "L'adresse email n'est pas valide.";
  }

  if (raw.includes("duplicate key") || raw.includes("already exists")) {
    return "Un client avec ces informations existe déjà.";
  }

  if (raw.includes("prénom est requis")) {
    return "Le prénom est requis pour un client individuel.";
  }

  if (raw.includes("nom est requis")) {
    return "Le nom est requis pour un client individuel.";
  }

  if (raw.includes("entreprise est requis")) {
    return "Le nom de l'entreprise est requis pour un client entreprise.";
  }

  if (raw.includes("permission denied")) {
    return "Action refusée par la sécurité de la base de données.";
  }

  return error.message || fallbackMessage;
}
