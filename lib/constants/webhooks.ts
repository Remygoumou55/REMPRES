export const WEBHOOK_EVENT_OPTIONS = [
  { value: "sale.validated", label: "Vente validée" },
  { value: "expense.submitted", label: "Dépense soumise" },
  { value: "lead.converted", label: "Lead converti" },
  { value: "stock.low", label: "Stock bas" },
  { value: "task.overdue", label: "Tâche en retard" },
  { value: "approval.requested", label: "Approbation demandée" },
  { value: "order.confirmed", label: "Commande confirmée" },
  { value: "*", label: "Tous les événements" },
] as const;

export const DELIVERY_STATUS_COLORS: Record<
  string,
  { bg: string; text: string }
> = {
  pending: { bg: "#FAEEDA", text: "#633806" },
  delivered: { bg: "#EAF3DE", text: "#27500A" },
  failed: { bg: "#FCEBEB", text: "#791F1F" },
  received: { bg: "#E6F1FB", text: "#0C447C" },
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  delivered: "Livré",
  failed: "Échec",
  received: "Reçu",
};
