/**
 * PUNT FINANCE — Root Layout
 * ─────────────────────────────────────────────────────────────────────────────
 * Framework : Next.js 16.2  (App Router)
 * Fonts     : next/font/google → Playfair Display (Serif) + Inter (Sans)
 * Security  : Content-Security-Policy, X-Frame-Options, Referrer-Policy
 *             injected as HTTP response headers via generateMetadata / headers().
 *             All font loading is self-hosted by Next.js — no external font
 *             CDN calls at runtime, eliminating a common CSP loophole.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

/* ── Google Fonts — self-hosted via next/font ────────────────────────────── */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

/* ── Static Metadata ─────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://puntfinance.com"
  ),
  title: {
    default: "Punt Finance — High Finance, Simplified in Swahili",
    template: "%s · Punt Finance",
  },
  description:
    "Punt Finance democratises Wall Street. We translate complex financial instruments, hedge-fund mechanics, and global equity markets into clear, accessible Swahili summaries.",
  keywords: [
    "Swahili finance",
    "Africa investing",
    "stock market Kiswahili",
    "financial literacy East Africa",
    "hedge funds explained",
    "Wall Street simplified",
  ],
  authors: [{ name: "Punt Finance Editorial Team" }],
  creator: "Punt Finance",
  publisher: "Punt Finance",
  openGraph: {
    type: "website",
    locale: "sw_KE",
    alternateLocale: ["en_US"],
    siteName: "Punt Finance",
    title: "Punt Finance — High Finance, Simplified in Swahili",
    description:
      "Breaking down Wall Street jargon and international market dynamics into highly accessible, localised Swahili summaries.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Punt Finance — Democratising High Finance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Punt Finance — High Finance, Simplified in Swahili",
    description:
      "Wall Street jargon and international equity markets decoded in Swahili.",
    images: ["/og-image.png"],
    creator: "@PuntFinance",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

/* ── Root Layout ─────────────────────────────────────────────────────────── */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /**
   * SECURITY: Server-side HTTP headers.
   * We read the nonce injected by Next.js middleware (if present) for CSP.
   * In production, add middleware.ts that generates a cryptographic nonce
   * per request and sets it on the request headers so we can thread it
   * into the <script> CSP directive below.
   *
   * Phase 2 note: when Alpha Vantage API calls are added, append
   *   connect-src 'self' https://www.alphavantage.co
   * to the Content-Security-Policy header in middleware.ts.
   */
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  const cspDirectives = [
    "default-src 'self'",
    /* next/font inlines base64 font data — 'self' covers it */
    "font-src 'self' data:",
    /* Next.js requires 'unsafe-inline' for its runtime styles in dev.
       In production, swap to nonce-based: style-src 'self' 'nonce-{nonce}' */
    "style-src 'self' 'unsafe-inline'",
    nonce
      ? `script-src 'self' 'nonce-${nonce}'`
      : "script-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    /* Phase 2: add https://www.alphavantage.co here */
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  return (
    <html
      lang="sw"          /* Default locale: Swahili — toggle updates this via JS */
      className={`${playfair.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Security headers via <meta> for environments without edge middleware */}
        <meta httpEquiv="Content-Security-Policy" content={cspDirectives} />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
      </head>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: "var(--color-cream)" }}
      >
        {/*
         * PHASE 2 INJECTION POINT — Global Providers
         * ─────────────────────────────────────────────────────────────────
         * Wrap children with:
         *   <LocaleProvider>     ← English / Swahili context
         *   <RateLimitBoundary>  ← Suspense boundary for rate-limit states
         *   <AnalyticsProvider>  ← Privacy-first analytics (Plausible / Fathom)
         * ─────────────────────────────────────────────────────────────────
         */}
        {children}
      </body>
    </html>
  );
}
