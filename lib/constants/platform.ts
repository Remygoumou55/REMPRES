export const API_TYPE_LABELS = {
  internal: "Interne",
  external: "Externe",
  webhook: "Webhook",
} as const;

export const API_TYPE_COLORS = {
  internal: { bg: "#E6F1FB", text: "#0C447C" },
  external: { bg: "#FAEEDA", text: "#633806" },
  webhook: { bg: "#EEEDFE", text: "#3C3489" },
} as const;

export const API_STATUS_LABELS = {
  active: "Actif",
  inactive: "Inactif",
  deprecated: "Obsolete",
} as const;

export const API_STATUS_COLORS = {
  active: { bg: "#EAF3DE", text: "#27500A" },
  inactive: { bg: "#F1EFE8", text: "#444441" },
  deprecated: { bg: "#FCEBEB", text: "#791F1F" },
} as const;

export const CONNECTOR_STATUS_LABELS = {
  active: "Connecte",
  inactive: "Inactif",
  error: "Erreur",
  pending: "En attente",
} as const;

export const CONNECTOR_STATUS_COLORS = {
  active: { bg: "#EAF3DE", text: "#27500A" },
  inactive: { bg: "#F1EFE8", text: "#444441" },
  error: { bg: "#FCEBEB", text: "#791F1F" },
  pending: { bg: "#FAEEDA", text: "#633806" },
} as const;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp Business",
  email: "Email generique",
  sms: "SMS",
  google: "Google Workspace",
  microsoft: "Microsoft 365",
  slack: "Slack",
  resend: "Resend",
  orange_money: "Orange Money",
  mtn_money: "MTN Mobile Money",
  other: "Autre",
};
