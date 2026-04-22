import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { appConfig } from "@/lib/config";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// ---------------------------------------------------------------------------
// Metadata (SEO + favicons)
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default:  appConfig.name,
    template: `%s | ${appConfig.name}`,
  },
  description: appConfig.tagline,
  applicationName: appConfig.name,
  authors: [{ name: appConfig.name, url: appConfig.marketingUrl }],
  metadataBase: new URL(appConfig.baseUrl),
  openGraph: {
    type:        "website",
    locale:      "fr_GN",
    siteName:    appConfig.name,
    title:       appConfig.name,
    description: appConfig.tagline,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: appConfig.name }],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/favicon.png" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={cn("font-sans", geistSans.variable)}>
      <head>
        {/* ── Preload des assets critiques de branding ── */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />

        {/* ── Favicon adaptatif light / dark ── */}
        <link
          rel="icon"
          href="/favicon-32x32.png"
          type="image/png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-dark.png"
          type="image/png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
