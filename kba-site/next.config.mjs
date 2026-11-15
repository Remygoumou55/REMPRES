/**
 * STATIC_EXPORT=1 npm run build  → produit un site 100 % statique dans le dossier out/
 * (à glisser sur Netlify Drop ou n'importe quel hébergeur, sans serveur Node).
 * @type {import('next').NextConfig}
 */
const isExport = process.env.STATIC_EXPORT === "1";
const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : { images: { formats: ["image/avif", "image/webp"] } }),
};
export default nextConfig;
