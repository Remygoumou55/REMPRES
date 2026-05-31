/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prod : retire les console.log/debug pour un JS un peu plus léger (garde error/warn).
  compiler:
    process.env.NODE_ENV === "production"
      ? { removeConsole: { exclude: ["error", "warn"] } }
      : undefined,

  // Next.js : `eslint.ignoreDuringBuilds` et `typescript.ignoreBuildErrors`
  // sont false par défaut — ne pas les activer (build prod doit lint + typecheck).

  // Tree-shake des paquets lourds côté client (navigation, graphiques)
  experimental: {
    // Tree-shake des barrels lourds (moins de JS client sur les pages dashboard / listes).
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@tanstack/react-query",
      "date-fns",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@react-pdf/renderer",
    ],
  },

  // ── Images ──────────────────────────────────────────────────────────────
  images: {
    // Images distantes : Supabase Storage uniquement.
    // ⚠️ Ne PAS remettre hostname: "**" — vecteur d'abus (le serveur
    //    téléchargerait et optimiserait n'importe quelle URL soumise).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },

  // ── HTTP Headers ─────────────────────────────────────────────────────────
  async headers() {
    return [
      // Mise en cache longue durée pour tous les assets statiques de branding
      // Le hash de contenu dans les noms de fichiers Next.js garantit l'invalidation
      {
        source: "/(logo|fallback-logo|favicon|android-chrome|apple-touch-icon)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Headers de sécurité globaux
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",            value: "SAMEORIGIN" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection",           value: "1; mode=block" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/config", destination: "/settings/permissions", permanent: true },
      { source: "/config/:path*", destination: "/settings/permissions", permanent: true },
      { source: "/admin/users", destination: "/settings/users", permanent: true },
      { source: "/admin/users/:path*", destination: "/settings/users", permanent: true },
      { source: "/admin/currency", destination: "/settings/rates", permanent: true },
      { source: "/admin/currency/:path*", destination: "/settings/rates", permanent: true },
      // Redirections légacy des dashboards département (pages purement redirect)
      { source: "/vente/dashboard", destination: "/dept/vente", permanent: false },
      { source: "/finance/dashboard", destination: "/dept/finance", permanent: false },
      { source: "/rh/dashboard", destination: "/dept/rh", permanent: false },
      { source: "/formation/dashboard", destination: "/dept/formation", permanent: false },
      { source: "/marketing/dashboard", destination: "/dept/marketing", permanent: false },
      { source: "/logistique/dashboard", destination: "/dept/logistique", permanent: false },
      { source: "/consultation/dashboard", destination: "/dept/formation", permanent: false },
    ];
  },

  // Ne pas désactiver `config.cache` en dev : avec Next 14 cela provoque souvent des
  // chunks CSS/JS incohérents après HMR → page « nue » (liens violets, sans layout).
  // Si un état bizarre persiste : supprimer le dossier `.next` puis relancer `npm run dev`.
};

export default nextConfig;
