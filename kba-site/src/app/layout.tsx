import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { site } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Voitures coréennes livrées en Afrique de l'Ouest`, template: `%s · ${site.short}` },
  description: site.description,
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
  openGraph: { type: "website", locale: "fr_FR", siteName: site.name, images: [{ url: "/og.png", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0B1F3A" };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: site.name,
  url: site.url,
  logo: `${site.url}/icon-512.png`,
  description: site.description,
  telephone: site.phoneDisplay,
  email: site.email,
  address: { "@type": "PostalAddress", addressLocality: site.address.city, addressCountry: "GN" },
  areaServed: ["GN", "SN", "ML", "CI", "TG", "BJ"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-white focus:px-4 focus:py-2">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">{children}</main>
        <Footer />
        <WhatsAppFloat />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
