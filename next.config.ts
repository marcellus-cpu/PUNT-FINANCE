/**
 * PUNT FINANCE — Next.js Configuration (Phase 4)
 * ─────────────────────────────────────────────────────────────────────────────
 * Security architecture — two complementary layers:
 *
 *   Layer 1 · middleware.ts  (per-request, edge runtime)
 *     Generates a cryptographic nonce per request and injects it into
 *     the CSP `script-src` directive. This is the primary CSP layer for
 *     all dynamic pages served by the Node/Edge runtime.
 *
 *   Layer 2 · next.config.ts  (static, build-time)  ← this file
 *     Sets a comprehensive baseline header set on EVERY response,
 *     including:
 *       • Static assets served directly from Vercel's CDN edge
 *       • Responses served from cache that bypass the middleware path
 *       • Non-Vercel deployments (self-hosted, Docker, AWS Lambda)
 *       • Local development (middleware nonce is absent in dev)
 *
 *     The CSP here uses `'unsafe-inline'` for script-src as a fallback
 *     because the nonce is not available at build time. Middleware overrides
 *     this with a nonce-based policy on every live request, so the static
 *     fallback only applies to CDN-cached assets (which contain no inline JS).
 *
 * Why both layers?
 *   Relying solely on middleware means a cache hit that bypasses middleware
 *   sends a response with no security headers. Relying solely on next.config.ts
 *   means losing nonce-based CSP. Both together provide defence-in-depth.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { NextConfig } from "next";

/* ── CSP helper ─────────────────────────────────────────────────────────── */

/**
 * buildCsp
 *
 * Assembles the Content-Security-Policy header string.
 * Called once at build time — the result is static for this config layer.
 *
 * For the per-request nonce-based version, see middleware.ts.
 */
function buildCsp(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const directives: string[] = [
    // Default: only same-origin resources
    "default-src 'self'",

    // Scripts: same-origin + unsafe-inline as a STATIC fallback only.
    // Middleware overrides this with 'nonce-{nonce}' on every live request.
    // 'strict-dynamic' allows nonce-trusted scripts to load further scripts.
    "script-src 'self' 'unsafe-inline' 'strict-dynamic'",

    // Styles: Next.js injects critical CSS as inline <style> tags at runtime.
    "style-src 'self' 'unsafe-inline'",

    // Fonts: self-hosted via next/font (no external CDN calls).
    "font-src 'self' data:",

    // Images: allow data URIs and blob URLs for dynamic image optimisation.
    "img-src 'self' data: blob:",

    // Connections: restrict XHR/fetch/WebSocket to our own origin + Supabase + Upstash.
    [
      "connect-src 'self'",
      supabaseUrl,
      "https://*.upstash.io",
      // Vercel analytics (enable if you add @vercel/analytics)
      // "https://vitals.vercel-insights.com",
    ]
      .filter(Boolean)
      .join(" "),

    // Frames: never embed us in an iframe (clickjacking defence).
    "frame-src 'none'",

    // Frame ancestors: belt-and-suspenders for iframe embedding.
    "frame-ancestors 'none'",

    // Objects: no plugins (Flash, Silverlight, PDF viewers).
    "object-src 'none'",

    // Base URI: prevents base tag hijacking for relative URL injection.
    "base-uri 'self'",

    // Form actions: all form submissions must go to our own origin.
    "form-action 'self'",

    // Upgrade insecure requests: forces HTTP → HTTPS rewrites in the browser.
    "upgrade-insecure-requests",

    // Block mixed content even if upgrade-insecure-requests is somehow bypassed.
    "block-all-mixed-content",
  ];

  return directives.join("; ");
}

/* ── Security header set ─────────────────────────────────────────────────── */

/**
 * SECURITY_HEADERS
 *
 * Applied to every route via the `headers()` config function.
 * These are the baseline headers. Middleware enriches them per-request
 * (adding the nonce to CSP, adding x-request-id for tracing, etc.).
 */
const SECURITY_HEADERS = [
  // ── Anti-clickjacking ──────────────────────────────────────────────
  // frame-ancestors in CSP is the modern standard; X-Frame-Options is
  // the legacy fallback for older browsers that don't honour CSP.
  { key: "X-Frame-Options",             value: "DENY" },

  // ── MIME sniffing prevention ──────────────────────────────────────
  // Forces browsers to respect the declared Content-Type header.
  // Prevents e.g. a .txt file being executed as JavaScript.
  { key: "X-Content-Type-Options",      value: "nosniff" },

  // ── Referrer policy ───────────────────────────────────────────────
  // Send the origin only (no path) to cross-origin destinations.
  // Prevents query string parameters in our URLs leaking to third parties.
  { key: "Referrer-Policy",             value: "strict-origin-when-cross-origin" },

  // ── Permissions policy ────────────────────────────────────────────
  // Explicitly disable browser features we never use.
  // Prevents a compromised third-party script from accessing these APIs.
  {
    key:   "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",   // Disables FLoC tracking
      "browsing-topics=()",   // Disables Topics API
      "payment=()",
      "usb=()",
    ].join(", "),
  },

  // ── HSTS ──────────────────────────────────────────────────────────
  // Force HTTPS for 1 year. includeSubDomains covers api.puntfinance.com etc.
  // `preload` submits the domain to browser HSTS preload lists — once set,
  // cannot be easily reverted. Only enable `preload` when fully committed to HTTPS.
  {
    key:   "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
    // Append "; preload" when ready for preload list submission.
  },

  // ── Content Security Policy (static baseline) ────────────────────
  { key: "Content-Security-Policy",     value: buildCsp() },

  // ── Cross-Origin policies ─────────────────────────────────────────
  // COEP: prevents loading cross-origin resources without explicit permission.
  // Required for SharedArrayBuffer and high-resolution timers (not needed now,
  // but future-proofs against Spectre mitigations).
  { key: "Cross-Origin-Embedder-Policy",  value: "require-corp" },

  // COOP: prevents cross-origin windows from accessing our window.opener.
  { key: "Cross-Origin-Opener-Policy",    value: "same-origin" },

  // CORP: prevents cross-origin pages from reading our resources.
  { key: "Cross-Origin-Resource-Policy",  value: "same-origin" },

  // ── Remove fingerprinting headers ────────────────────────────────
  { key: "X-DNS-Prefetch-Control",      value: "off" },
];

/* ── Next.js configuration ──────────────────────────────────────────────── */

const nextConfig: NextConfig = {
  /* ── TypeScript & ESLint ─────────────────────────────────────────────
     Fail the build on type errors and lint violations.
     Never deploy with ignoreBuildErrors: true in production.             */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  /* ── Image optimisation ──────────────────────────────────────────────
     Allowlist the domains Next.js <Image> may optimise.
     Never use wildcard (*) — it allows any third-party image host.       */
  images: {
    remotePatterns: [
      /* Alpha Vantage banner images (optional — used in Phase 3 if you
         add image display to the LedgerCard component)                   */
      {
        protocol: "https",
        hostname: "**.alphavantage.co",
      },
    ],
    /* Disallow SVG optimisation — SVGs can contain JavaScript.
       Use next/image with the unoptimized prop for SVGs explicitly.      */
    dangerouslyAllowSVG:          false,
    contentSecurityPolicy:        "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType:       "attachment",
  },

  /* ── Security headers (static layer) ────────────────────────────────── */
  async headers() {
    return [
      {
        /* Apply to all routes — the wildcard `/:path*` matches every URL
           path including the root `/`. API routes, pages, and static assets
           all receive this header set.                                      */
        source:  "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        /* Additional cache control for API routes — never cache sensitive
           endpoints at the CDN layer.                                        */
        source: "/api/:path*",
        headers: [
          {
            key:   "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key:   "Pragma",
            value: "no-cache",
          },
        ],
      },
    ];
  },

  /* ── Redirect: strip www ─────────────────────────────────────────────── */
  async redirects() {
    return [
      {
        source:      "/:path*",
        has:         [{ type: "host", value: "www.puntfinance.com" }],
        destination: "https://puntfinance.com/:path*",
        permanent:   true,
      },
    ];
  },

  /* ── Powered-By header removal ───────────────────────────────────────── */
  poweredByHeader: false,

  /* ── Strict mode ─────────────────────────────────────────────────────── */
  reactStrictMode: true,

  /* ── Compiler options ────────────────────────────────────────────────── */
  compiler: {
    /* Remove console.log in production. console.error and console.warn are
       retained for server-side monitoring / Vercel log drains.             */
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  /* ── Experimental ────────────────────────────────────────────────────── */
  experimental: {
    /* Typed routes — catches broken <Link href="..."> at build time. */
    typedRoutes: true,
  },
};

export default nextConfig;
