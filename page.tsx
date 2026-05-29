
import React from "react";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, Globe, ChevronRight } from "lucide-react";
import { HeroSearch } from "@/app/components/HeroSearch";
import { DailyLedger } from "@/app/components/DailyLedger";

export const metadata: Metadata = {
  title: "Punt Finance — High Finance, Simplified in Swahili",
  description: "Search any financial term and receive a clear Swahili summary.",
};

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

const PLACEHOLDER_BOOKS: BookItem[] = [
  {
    id: "1",
    level: "Mwanzo",
    levelEn: "Beginner",
    levelColor: "#1B4332",
    title: "The Richest Man in Babylon",
    author: "George S. Clason",
    year: "1926",
    description: "Timeless parables set in ancient Babylon illuminate the universal laws of personal wealth — saving, investing, and guarding against loss.",
    isbn: "978-1-5051-1521-8",
  },
  {
    id: "2",
    level: "Kati",
    levelEn: "Intermediate",
    levelColor: "#B5892A",
    title: "A Random Walk Down Wall Street",
    author: "Burton G. Malkiel",
    year: "1973",
    description: "An authoritative survey of equity markets, index investing, and the efficient market hypothesis. Malkiel's evidence-based approach challenges active management.",
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
    description: "The foundational text of value investing. Graham and Dodd establish the discipline of scrutinising financial statements and intrinsic value estimation.",
    isbn: "978-0-07-159253-6",
  },
];

function GlobalHeader() {
  return (
    <header style={{ borderBottom: "1px solid #E2DDD5" }} className="sticky top-0 z-50">
      <div style={{ backgroundColor: "rgba(250,249,246,0.96)", backdropFilter: "blur(8px)" }}>
        <div style={{ borderBottom: "1px solid #E2DDD5", backgroundColor: "var(--color-oxford)" }} className="w-full py-1.5 px-4 sm:px-8 flex items-center justify-between">
          <p className="label-fin" style={{ color: "#E4CA89", letterSpacing: "0.18em" }}>
            Democratising High Finance · Kueleza Fedha za Kimataifa
          </p>
          <div className="flex items-center gap-2">
            <Globe size={10} style={{ color: "#E4CA89", opacity: 0.7 }} />
            <button
              aria-label="Toggle language"
              style={{ color: "#E4CA89" }}
              className="label-fin flex items-center gap-1.5 cursor-pointer bg-transparent border-none"
            >
              <span style={{ borderBottom: "1px solid #E4CA89" }}>EN</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ opacity: 0.6 }}>SW</span>
            </button>
          </div>
        </div>
        <nav role="navigation" aria-label="Primary navigation" className="max-w-screen-xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <a href="/" aria-label="Punt Finance — Home" className="flex items-baseline gap-2">
            <span style={{ fontFamily: "var(--font-serif)", color: "#B5892A", fontSize: "1.375rem", fontWeight: 700 }} aria-hidden="true">₱</span>
            <span style={{ fontFamily: "var(--font-serif)", color: "var(--color-oxford)", fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "0.04em" }}>Punt Finance</span>
          </a>
          <ul className="hidden md:flex items-center gap-7 list-none" role="list">
            {[{ label: "Markets", href: "/markets" }, { label: "Ledger", href: "#ledger" }, { label: "Library", href: "#library" }, { label: "Glossary", href: "/glossary" }].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="nav-item">{item.label}</a>
              </li>
            ))}
          </ul>
          
      href="/subscribe"
  className="hidden sm:inline-flex items-center gap-1.5 label-fin"
  style={{
    textDecoration: "none",
    padding: "0.45rem 1.1rem",
    border: "1px solid #002147",
    background: "#002147",
    fontSize: "0.625rem",
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties}
>
  Subscribe <ChevronRight size={9} strokeWidth={2.5} />
</a>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      style={{ borderBottom: "1px solid #E2DDD5", backgroundColor: " #FAF9F6" }}
      className="w-full"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-20 sm:py-28 lg:py-32 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-8">
          <span className="ornament-rule" aria-hidden="true" />
          <p className="label-fin" style={{ color: "#B5892A", letterSpacing: "0.2em" }}>The Simplification Engine</p>
          <span className="ornament-rule" aria-hidden="true" />
        </div>
        <h1
          id="hero-heading"
          className="max-w-3xl"
          style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, color: "var(--color-oxford)", lineHeight: 1.12, letterSpacing: "-0.02em", marginBottom: "1.25rem" }}
        >
          Every Market Concept,{" "}
          <em style={{ fontStyle: "italic", color: "#B5892A" }}>Decoded.</em>
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", color: "var(--color-slate)", maxWidth: "38rem", marginBottom: "3rem", lineHeight: 1.8 }}>
          Type any financial term, equity ticker, or market concept below. Our engine will return a clear, authoritative{" "}
          <strong style={{ fontWeight: 600, color: "var(--color-oxford)" }}>Swahili summary</strong>{" "}
          — drawn from live global data and cached in our private ledger.
        </p>
        <HeroSearch />
      </div>
    </section>
  );
}

function BookCard({ book }: { book: BookItem }) {
  return (
    <article className="book-card" aria-label={`${book.title} by ${book.author}`}>
      <div
        style={{ backgroundColor: "var(--color-oxford)", height: "14rem", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "1.5rem" }}
        aria-hidden="true"
      >
        <div style={{ height: "1px", backgroundColor: "#B5892A", marginBottom: "0.75rem", width: "2rem" }} />
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.9375rem", fontStyle: "italic", color: "rgba(250,249,246,0.85)", lineHeight: 1.3 }}>{book.title}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "rgba(250,249,246,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.5rem" }}>
          {book.author} · {book.year}
        </p>
      </div>
      <div style={{ padding: "1.5rem" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-level" style={{ color: book.levelColor, borderColor: book.levelColor }}>{book.level}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "#7A7369", letterSpacing: "0.06em" }}>{book.levelEn}</span>
        </div>
        <hr className="rule mb-3" aria-hidden="true" />
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "var(--color-slate)", lineHeight: 1.75, marginBottom: "1.25rem" }}>{book.description}</p>
        <div className="flex items-center justify-between">
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5625rem", color: "#7A7369", letterSpacing: "0.08em", textTransform: "uppercase" }}>ISBN: {book.isbn}</p>
          <a href={`https://openlibrary.org/isbn/${book.isbn}`} target="_blank" rel="noopener noreferrer" className="link-brass" style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", letterSpacing: "0.08em" }}>
            <span className="flex items-center gap-1"><BookOpen size={9} aria-hidden="true" /> Find a Copy</span>
          </a>
        </div>
      </div>
    </article>
  );
}

function LibrarySection({ books }: { books: BookItem[] }) {
  return (
    <section id="library" aria-labelledby="library-heading" style={{ backgroundColor: "#F4EFE6", borderBottom: "1px solid #E2DDD5" }} className="w-full">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-20 sm:py-24">
        <div className="flex items-end justify-between mb-10" style={{ borderBottom: "1px solid#C9C3B8", paddingBottom: "1.25rem" }}>
          <div>
            <p className="label-fin mb-2" style={{ color: "#7A7369" }}>§02 — Financial Literacy</p>
            <h2 id="library-heading" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 400, color: "var(--color-oxford)", letterSpacing: "-0.01em" }}>The Library</h2>
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", color: "#7A7369", letterSpacing: "0.06em", textAlign: "right", lineHeight: 1.6 }}>
            <p>Mwanzo · Kati · Mtaalam</p>
            <p>Beginner · Intermediate · Professional</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" role="list" style={{ backgroundColor: "#E2DDD5" }}>
          {books.map((book) => (
            <div key={book.id} role="listitem" style={{ backgroundColor: "#F4EFE6" }}>
              <BookCard book={book} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer role="contentinfo" style={{ backgroundColor: "var(--color-oxford)", borderTop: "1px solid #1A3A6E" }} className="w-full">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <span style={{ fontFamily: "var(--font-serif)", color: "#B5892A", fontSize: "1.25rem", fontWeight: 700 }} aria-hidden="true">₱</span>
              <span style={{ fontFamily: "var(--font-serif)", color: " #FAF9F6", fontSize: "1rem", fontWeight: 500, letterSpacing: "0.05em" }}>Punt Finance</span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(250,249,246,0.5)", lineHeight: 1.7 }}>
              Democratising high finance through accessible, authoritative Swahili financial intelligence.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <p className="label-fin mb-4" style={{ color: "#B5892A" }}>Navigation</p>
            <ul className="list-none flex flex-col gap-2.5">
              {["Markets", "Glossary", "Library", "About", "Subscribe"].map((l) => (
                <li key={l}>
                  <a href={`/${l.toLowerCase()}`} style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(250,249,246,0.6)" }}>{l}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="label-fin mb-4" style={{ color: "#B5892A" }}>Legal</p>
            <ul className="list-none flex flex-col gap-2.5">
              {["Privacy Policy", "Terms of Use", "Disclaimer"].map((l) => (
                <li key={l}>
                  <a href={`/${l.toLowerCase().replace(/ /g, "-")}`} style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(250,249,246,0.6)" }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "rgba(250,249,246,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            © {currentYear} Punt Finance. For informational purposes only. Not financial advice.
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "rgba(250,249,246,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Phase 4 · Security & Launch
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <a href="#main-content" style={{ position: "absolute", top: "-100%", left: "1rem", backgroundColor: "var(--color-oxford)", color: " #FAF9F6", padding: "0.5rem 1rem", fontFamily: "var(--font-sans)", fontSize: "0.875rem", zIndex: 9999 }} className="focus:top-2">
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
