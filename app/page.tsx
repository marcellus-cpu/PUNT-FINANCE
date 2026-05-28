/**
 * PUNT FINANCE — Homepage (React Server Component)
 * ─────────────────────────────────────────────────────────────────────────────
 * This entire file renders on the server. Zero client-side JS is shipped
 * for this page unless a 'use client' child component is explicitly imported.
 *
 * Sections:
 *   1. GlobalHeader      — brand, locale toggle, navigation
 *   2. Hero              — Simplification Engine search form
 *   3. DailyLedger       — news card grid (Phase 2: live Alpha Vantage feed)
 *   4. Library           — book recommendations with Swahili difficulty badges
 *   5. Footer            — minimal brand footer
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, Globe, ChevronRight } from "lucide-react";
/* Phase 1 static search action replaced — translateTerm Server Action
   is now imported inside HeroSearch (client component) directly.       */
import { HeroSearch }   from "@/app/components/HeroSearch";
import { DailyLedger } from "@/app/components/DailyLedger";

/* ── Per-page metadata override ─────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "Punt Finance — High Finance, Simplified in Swahili",
  description:
    "Search any financial term, equity, or market concept and receive a clear, authoritative Swahili summary. Democratising Wall Street, one term at a time.",
};


/* ── Phase 3: Daily Ledger is now served by the DailyLedger async RSC
   in app/components/DailyLedger.tsx. ISR revalidates every 6 hours.
   ALPHA_VANTAGE_API_KEY + ANTHROPIC_API_KEY remain server-only.      */

/**
 * PHASE 4 INJECTION POINT — Book Data (CMS integration pending)
 * ─────────────────────────────────────────────────────────────────────────
 * Replace with a Sanity / Contentful fetch or Drizzle ORM query.
 * ─────────────────────────────────────────────────────────────────────────
 */
const PLACEHOLDER_BOOKS: BookItem[] = [
  {
    id: "1",
    level: "Mwanzo",
    levelEn: "Beginner",
    levelColor: "var(--color-forest)",
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    year: "1926",
    description:
      "Timeless parables set in ancient Babylon illuminate the universal laws of personal wealth — saving, investing, and guarding against loss. The ideal first text for any student of finance.",
    isbn: "978-1-5051-1521-8",
  },
  {
    id: "2",
    level: "Kati",
    levelEn: "Intermediate",
    levelColor: "var(--color-brass)",
    title: "A Random Walk Down Wall Street",
    author: "Burton G. Malkiel",
    year: "1973",
    description:
      "An authoritative survey of equity markets, index investing, and the efficient market hypothesis. Malkiel's evidence-based approach challenges active management and builds a rigorous theoretical framework.",
    isbn: "978-0-393-35826-9",
  },
  {
    id: "3",
    level: "Mtaalam",
    levelEn: "Professional",
    levelColor: "var(--color-oxford)",
    title: "Security Analysis",
    author: "Benjamin Graham & David Dodd",
    year: "1934",
    description:
      "The foundational text of value investing. Graham and Dodd establish the discipline of scrutinising financial statements, intrinsic value estimation, and the margin of safety — required reading for any serious analyst.",
    isbn: "978-0-07-159253-6",
  },
];

/* ── TypeScript Interfaces ───────────────────────────────────────────────── */
interface BookItem {
  id: string;
  level: string;
  levelEn: string;
  levelColor: string;
  title: string;
  author: string;
  year: string;
  description: string;
  isbn: string;
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — GlobalHeader
   ════════════════════════════════════════════════════════════════════════════ */
function GlobalHeader() {
  return (
    <header
      style={{ borderBottom: "1px solid var(--color-divider)" }}
      className="sticky top-0 z-50"
    >
      {/* Frosted-cream backdrop for depth */}
      <div
        style={{ backgroundColor: "rgba(250,249,246,0.96)", backdropFilter: "blur(8px)" }}
        className="w-full"
      >
        {/* ── Top micro-bar: editorial tagline ── */}
        <div
          style={{
            borderBottom: "1px solid var(--color-divider)",
            backgroundColor: "var(--color-oxford)",
          }}
          className="w-full py-1.5 px-4 sm:px-8 flex items-center justify-between"
        >
          <p
            className="label-fin"
            style={{ color: "var(--color-champagne)", letterSpacing: "0.18em" }}
          >
            Democratising High Finance · Kueleza Fedha za Kimataifa
          </p>
          {/*
           * PHASE 2 INJECTION POINT — Locale Toggle
           * ─────────────────────────────────────────────────────────────────
           * Replace this static display with a 'use client' LocaleToggle
           * component that:
           *   • Reads locale from a cookie via next/headers (server-read)
           *   • Fires a Server Action to set the locale cookie on toggle
           *   • Triggers router.refresh() to re-render all RSC with new locale
           * ─────────────────────────────────────────────────────────────────
           */}
          <div className="flex items-center gap-2">
            <Globe
              size={10}
              style={{ color: "var(--color-champagne)", opacity: 0.7 }}
            />
            <button
              aria-label="Toggle language between English and Swahili"
              style={{ color: "var(--color-champagne)" }}
              className="label-fin flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer bg-transparent border-none"
            >
              <span style={{ borderBottom: "1px solid var(--color-champagne)" }}>EN</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ opacity: 0.6 }}>SW</span>
            </button>
          </div>
        </div>

        {/* ── Main navigation bar ── */}
        <nav
          role="navigation"
          aria-label="Primary navigation"
          className="max-w-screen-xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between"
        >
          {/* Brand */}
          <a
            href="/"
            aria-label="Punt Finance — Home"
            className="flex items-baseline gap-2 group"
          >
            {/*
             * Brand monogram — a thin 1px serif "P" mark
             * In Phase 2, replace with an <Image> of the SVG logomark.
             */}
            <span
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--color-brass)",
                fontSize: "1.375rem",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
              aria-hidden="true"
            >
              ₱
            </span>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--color-oxford)",
                fontSize: "1.0625rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              Punt Finance
            </span>
          </a>

          {/* Desktop navigation links */}
          <ul
            className="hidden md:flex items-center gap-7 list-none"
            role="list"
          >
            {[
              { label: "Markets", href: "/markets" },
              { label: "Ledger", href: "#ledger" },
              { label: "Library", href: "#library" },
              { label: "Glossary", href: "/glossary" },
            ].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="nav-item">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA — Subscribe */}
          <a
            href="/subscribe"
            className="hidden sm:inline-flex items-center gap-1.5 label-fin transition-colors"
            style={{
              color: "var(--color-cream)",
              backgroundColor: "var(--color-oxford)",
              padding: "0.45rem 1.1rem",
              border: "1px solid var(--color-oxford)",
            }}
            aria-label="Subscribe to Punt Finance"
          >
            Subscribe
            <ChevronRight size={9} strokeWidth={2.5} />
          </a>
        </nav>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — Hero: The Simplification Engine (Phase 2)
   RSC shell — only the static chrome (heading, sub-copy) renders on server.
   <HeroSearch> is the isolated 'use client' island that owns all interactivity.
   ════════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      style={{
        borderBottom:    "1px solid var(--color-divider)",
        backgroundColor: "var(--color-cream)",
      }}
      className="w-full"
    >
      <div
        className="max-w-screen-xl mx-auto px-4 sm:px-8 py-20 sm:py-28 lg:py-32 flex flex-col items-center text-center"
        /* Bottom padding reduced slightly — ResultCard extends the section visually */
      >
        {/* ── Eyebrow label ── */}
        <div className="flex items-center gap-3 mb-8">
          <span className="ornament-rule" aria-hidden="true" />
          <p className="label-fin" style={{ color: "var(--color-brass)", letterSpacing: "0.2em" }}>
            The Simplification Engine
          </p>
          <span className="ornament-rule" aria-hidden="true" />
        </div>

        {/* ── Main heading — RSC: zero JS, full SEO value ── */}
        <h1
          id="hero-heading"
          className="max-w-3xl"
          style={{
            fontFamily:    "var(--font-serif)",
            fontSize:      "clamp(2rem, 5vw, 3.5rem)",
            fontWeight:    400,
            color:         "var(--color-oxford)",
            lineHeight:    1.12,
            letterSpacing: "-0.02em",
            marginBottom:  "1.25rem",
          }}
        >
          Every Market Concept,{" "}
          <em style={{ fontStyle: "italic", color: "var(--color-brass)" }}>Decoded.</em>
        </h1>

        {/* ── Sub-heading ── */}
        <p
          style={{
            fontFamily:   "var(--font-sans)",
            fontSize:     "1rem",
            color:        "var(--color-slate)",
            maxWidth:     "38rem",
            marginBottom: "3rem",
            lineHeight:   1.8,
          }}
        >
          Type any financial term, equity ticker, or market concept below.
          Our engine will return a clear, authoritative{" "}
          <strong style={{ fontWeight: 600, color: "var(--color-oxford)" }}>
            Swahili summary
          </strong>{" "}
          — drawn from live global data and cached in our private ledger.
        </p>

        {/*
         * ── Client Island: HeroSearch ──────────────────────────────────
         * Everything below this line is client-side interactive.
         * The server renders nothing further in this component — the
         * HeroSearch island owns its own form, loading state, and result.
         *
         * RSC boundary: the <section> and <h1> above are server-rendered
         * and fully SEO-indexed. Only the interactive form widget is
         * hydrated on the client.
         * ─────────────────────────────────────────────────────────────
         */}
        <HeroSearch />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — Library Section
   ════════════════════════════════════════════════════════════════════════════ */
function LibrarySection({ books }: { books: BookItem[] }) {
  return (
    <section
      id="library"
      aria-labelledby="library-heading"
      style={{
        backgroundColor: "var(--color-parchment)",
        borderBottom: "1px solid var(--color-divider)",
      }}
      className="w-full"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-20 sm:py-24">

        {/* ── Section header ── */}
        <div
          className="flex items-end justify-between mb-10"
          style={{ borderBottom: "1px solid var(--color-divider-dark)", paddingBottom: "1.25rem" }}
        >
          <div>
            <p className="label-fin mb-2" style={{ color: "var(--color-muted)" }}>
              §02 — Financial Literacy
            </p>
            <h2
              id="library-heading"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 400,
                color: "var(--color-oxford)",
                letterSpacing: "-0.01em",
              }}
            >
              The Library
            </h2>
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.6875rem",
              color: "var(--color-muted)",
              letterSpacing: "0.06em",
              textAlign: "right",
              lineHeight: 1.6,
            }}
          >
            <p>Mwanzo · Kati · Mtaalam</p>
            <p>Beginner · Intermediate · Professional</p>
          </div>
        </div>

        {/* Instructional sub-copy */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--color-slate)",
            maxWidth: "38rem",
            marginBottom: "2.5rem",
            lineHeight: 1.8,
          }}
        >
          A curated selection of foundational texts. Each carries a Swahili
          difficulty classification — from{" "}
          <em style={{ fontStyle: "italic" }}>Mwanzo</em> (the first step) to{" "}
          <em style={{ fontStyle: "italic" }}>Mtaalam</em> (the practitioner's
          standard).
        </p>

        {/* Book grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          role="list"
          aria-label="Recommended financial literacy books"
          style={{ backgroundColor: "var(--color-divider)" }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              role="listitem"
              style={{ backgroundColor: "var(--color-parchment)" }}
            >
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — Footer
   ════════════════════════════════════════════════════════════════════════════ */
function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      style={{ backgroundColor: "var(--color-oxford)", borderTop: "1px solid var(--color-oxford-dim)" }}
      className="w-full"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

          {/* Column 1: Brand */}
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-brass)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                }}
                aria-hidden="true"
              >
                ₱
              </span>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--color-cream)",
                  fontSize: "1rem",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                }}
              >
                Punt Finance
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8125rem",
                color: "rgba(250,249,246,0.5)",
                lineHeight: 1.7,
                maxWidth: "18rem",
              }}
            >
              Democratising high finance through accessible, authoritative Swahili
              financial intelligence.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <nav aria-label="Footer navigation">
            <p className="label-fin mb-4" style={{ color: "var(--color-brass)", letterSpacing: "0.16em" }}>
              Navigation
            </p>
            <ul className="list-none flex flex-col gap-2.5">
              {["Markets", "Glossary", "Library", "About", "Subscribe"].map((l) => (
                <li key={l}>
                  <a
                    href={`/${l.toLowerCase()}`}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      color: "rgba(250,249,246,0.6)",
                      letterSpacing: "0.04em",
                      transition: "color 180ms",
                    }}
                    className="hover:opacity-100"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 3: Legal */}
          <div>
            <p className="label-fin mb-4" style={{ color: "var(--color-brass)", letterSpacing: "0.16em" }}>
              Legal
            </p>
            <ul className="list-none flex flex-col gap-2.5">
              {["Privacy Policy", "Terms of Use", "Disclaimer", "Cookie Policy"].map((l) => (
                <li key={l}>
                  <a
                    href={`/${l.toLowerCase().replace(/ /g, "-")}`}
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      color: "rgba(250,249,246,0.6)",
                      letterSpacing: "0.04em",
                      transition: "color 180ms",
                    }}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.625rem",
              color: "rgba(250,249,246,0.35)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            © {currentYear} Punt Finance. For informational purposes only. Not
            financial advice.
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.625rem",
              color: "rgba(250,249,246,0.25)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {/* PHASE 2: Replace with next/headers build timestamp */}
            Phase 3 · Daily Ledger Pipeline
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE — Default Export (React Server Component)
   ════════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  /*
   * Phase 3 complete — Daily Ledger is now a live async RSC.
   * The <DailyLedger /> component below handles its own data fetching
   * via fetchDailyLedger() with a 6-hour ISR revalidation window.
   *
   * Phase 4 INJECTION POINT — Library Books (CMS integration):
   *   Make this component async and replace PLACEHOLDER_BOOKS with:
   *   const books = await fetchLibraryBooks({ featured: true });
   *   Wrap in unstable_cache with revalidate: 3600.
   */

  return (
    <>
      {/* ── Skip-to-content link for keyboard / screen-reader users ── */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: "-100%",
          left: "1rem",
          backgroundColor: "var(--color-oxford)",
          color: "var(--color-cream)",
          padding: "0.5rem 1rem",
          fontFamily: "var(--font-sans)",
          fontSize: "0.875rem",
          zIndex: 9999,
          transition: "top 200ms",
        }}
        className="focus:top-2"
      >
        Skip to main content
      </a>

      <GlobalHeader />

      <main id="main-content" role="main">
        <HeroSection />
        <DailyLedger />
        <LibrarySection books={PLACEHOLDER_BOOKS} />
      </main>

      <SiteFooter />
    </>
  );
}
