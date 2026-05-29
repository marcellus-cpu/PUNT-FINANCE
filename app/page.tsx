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
    description: "An authoritative survey of equity markets, index investing, and the efficient market hypothesis.",
    isbn: "978-0-393-35826-9",
  },
  {
    id: "3",
    level: "Mtaalam",
    levelEn: "Professional",
    levelColor: "#002147",
    title: "Security Analysis",
    author: "Benjamin Graham & David Dodd",
    year: "1934",
    description: "The foundational text of value investing. Graham and Dodd establish the discipline of scrutinising financial statements and intrinsic value estimation.",
    isbn: "978-0-07-159253-6",
  },
];

function GlobalHeader() {
  return (
    <header style={{ borderBottom: "1px solid #E2DDD5", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ backgroundColor: "rgba(250,249,246,0.96)", backdropFilter: "blur(8px)" }}>
        <div style={{ borderBottom: "1px solid #E2DDD5", backgroundColor: "#002147", width: "100%", padding: "0.375rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p className="label-fin" style={{ color: "#E4CA89", letterSpacing: "0.18em" }}>
            Democratising High Finance · Kueleza Fedha za Kimataifa
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Globe size={10} style={{ color: "#E4CA89", opacity: 0.7 }} />
            <button aria-label="Toggle language" style={{ color: "#E4CA89", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ borderBottom: "1px solid #E4CA89" }}>EN</span>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ opacity: 0.6 }}>SW</span>
            </button>
          </div>
        </div>
        <nav role="navigation" aria-label="Primary navigation" style={{ maxWidth: "1280px", margin: "0 auto", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" aria-label="Punt Finance" style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", textDecoration: "none" }}>
            <span style={{ fontFamily: "var(--font-serif)", color: "#B5892A", fontSize: "1.375rem", fontWeight: 700 }}>₱</span>
            <span style={{ fontFamily: "var(--font-serif)", color: "#002147", fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "0.04em" }}>Punt Finance</span>
          </a>
          <ul style={{ display: "flex", alignItems: "center", gap: "1.75rem", listStyle: "none", margin: 0, padding: 0 }}>
            {[{ label: "Markets", href: "/markets" }, { label: "Ledger", href: "#ledger" }, { label: "Library", href: "#library" }, { label: "Glossary", href: "/glossary" }].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="nav-item">{item.label}</a>
              </li>
            ))}
          </ul>
          <a href="/subscribe" className="subscribe-btn label-fin" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
            Subscribe <ChevronRight size={9} strokeWidth={2.5} />
          </a>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" style={{ borderBottom: "1px solid #E2DDD5", backgroundColor: "#FAF9F6", width: "100%" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <span className="ornament-rule" aria-hidden="true" />
          <p className="label-fin" style={{ color: "#B5892A", letterSpacing: "0.2em" }}>The Simplification Engine</p>
          <span className="ornament-rule" aria-hidden="true" />
        </div>
        <h1 id="hero-heading" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, color: "#002147", lineHeight: 1.12, letterSpacing: "-0.02em", marginBottom: "1.25rem", maxWidth: "48rem" }}>
          Every Market Concept,{" "}
          <em style={{ fontStyle: "italic", color: "#B5892A" }}>Decoded.</em>
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", color: "#4A4A4A", maxWidth: "38rem", marginBottom: "3rem", lineHeight: 1.8 }}>
          Type any financial term, equity ticker, or market concept below. Our engine will return a clear, authoritative{" "}
          <strong style={{ fontWeight: 600, color: "#002147" }}>Swahili summary</strong>{" "}
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
      <div style={{ backgroundColor: "#002147", height: "14rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "1.5rem", overflow: "hidden" }} aria-hidden="true">
        <div style={{ height: "1px", backgroundColor: "#B5892A", marginBottom: "0.75rem", width: "2rem" }} />
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.9375rem", fontStyle: "italic", color: "rgba(250,249,246,0.85)", lineHeight: 1.3 }}>{book.title}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "rgba(250,249,246,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.5rem" }}>{book.author} · {book.year}</p>
      </div>
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <span className="badge-level" style={{ color: book.levelColor, borderColor: book.levelColor }}>{book.level}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "#7A7369", letterSpacing: "0.06em" }}>{book.levelEn}</span>
        </div>
        <hr className="rule" style={{ marginBottom: "0.75rem" }} aria-hidden="true" />
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "#4A4A4A", lineHeight: 1.75, marginBottom: "1.25rem" }}>{book.description}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.5625rem", color: "#7A7369", letterSpacing: "0.08em", textTransform: "uppercase" }}>ISBN: {book.isbn}</p>
          <a href={`https://openlibrary.org/isbn/${book.isbn}`} target="_blank" rel="noopener noreferrer" className="link-brass" style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <BookOpen size={9} aria-hidden="true" /> Find a Copy
          </a>
        </div>
      </div>
    </article>
  );
}

function LibrarySection({ books }: { books: BookItem[] }) {
  return (
    <section id="library" aria-labelledby="library-heading" style={{ backgroundColor: "#F4EFE6", borderBottom: "1px solid #E2DDD5", width: "100%" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2.5rem", borderBottom: "1px solid #C9C3B8", paddingBottom: "1.25rem" }}>
          <div>
            <p className="label-fin" style={{ color: "#7A7369", marginBottom: "0.5rem" }}>§02 — Financial Literacy</p>
            <h2 id="library-heading" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 400, color: "#002147", letterSpacing: "-0.01em" }}>The Library</h2>
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "0.6875rem", color: "#7A7369", letterSpacing: "0.06em", textAlign: "right", lineHeight: 1.6 }}>
            <p>Mwanzo · Kati · Mtaalam</p>
            <p>Beginner · Intermediate · Professional</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1px", backgroundColor: "#E2DDD5" }}>
          {books.map((book) => (
            <div key={book.id} style={{ backgroundColor: "#F4EFE6" }}>
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
    <footer style={{ backgroundColor: "#002147", borderTop: "1px solid #1A3A6E", width: "100%" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "3rem 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "2.5rem", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontFamily: "var(--font-serif)", color: "#B5892A", fontSize: "1.25rem", fontWeight: 700 }}>₱</span>
              <span style={{ fontFamily: "var(--font-serif)", color: "#FAF9F6", fontSize: "1rem", fontWeight: 500 }}>Punt Finance</span>
            </div>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(250,249,246,0.5)", lineHeight: 1.7 }}>Democratising high finance through accessible Swahili financial intelligence.</p>
          </div>
          <div>
            <p className="label-fin" style={{ color: "#B5892A", marginBottom: "1rem" }}>Navigation</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {["Markets", "Glossary", "Library", "About"].map((l) => (
                <li key={l}><a href={`/${l.toLowerCase()}`} style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(250,249,246,0.6)", textDecoration: "none" }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-fin" style={{ color: "#B5892A", marginBottom: "1rem" }}>Legal</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {["Privacy Policy", "Terms of Use", "Disclaimer"].map((l) => (
                <li key={l}><a href={`/${l.toLowerCase().replace(/ /g, "-")}`} style={{ fontFamily: "var(--font-sans)", fontSize: "0.8125rem", color: "rgba(250,249,246,0.6)", textDecoration: "none" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "rgba(250,249,246,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>© {currentYear} Punt Finance. For informational purposes only.</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.625rem", color: "rgba(250,249,246,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Phase 4 · Security & Launch</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
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
