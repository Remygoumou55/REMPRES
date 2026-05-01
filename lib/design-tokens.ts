export const designTokens = {
  colors: {
    primary: "primary",
    primaryForeground: "primary-foreground",
    dangerText: "text-red-700",
    dangerBg: "bg-red-50",
    successText: "text-emerald-700",
    successBg: "bg-emerald-50",
    mutedText: "text-gray-500",
    border: "border-gray-200",
    surface: "bg-white",
  },
  spacing: {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
    xl: "gap-6",
    section: "space-y-4",
    form: "space-y-3",
  },
  typography: {
    label: "text-xs font-medium text-gray-500",
    body: "text-sm text-darktext",
    caption: "text-xs text-gray-400",
    heading: "text-base font-bold text-darktext",
  },
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
    xl: "rounded-3xl",
  },
  shadows: {
    card: "shadow-sm",
    dropdown: "shadow-lg",
    modal: "shadow-2xl",
    emphasis: "shadow-md shadow-primary/25",
  },
} as const;

export const feedbackMessages = {
  success: "Opération réussie",
  error: "Échec de l’opération",
  genericError: "Une erreur est survenue",
  loading: "Traitement en cours...",
  noData: "Aucune donnée disponible",
} as const;
