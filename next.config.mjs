/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Images ──────────────────────────────────────────────────────────────
  images: {
    // Les URLs d'image produit sont saisies manuellement et peuvent
    // pointer vers n'importe quel domaine externe (Supabase Storage, CDN…).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
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

  // ── Redirects ─────────────────────────────────────────────────────────────
  // Redirige la racine vers /login si l'utilisateur n'est pas connecté
  // (géré par middleware.ts, pas besoin de redirect ici)
};

export default nextConfig;
