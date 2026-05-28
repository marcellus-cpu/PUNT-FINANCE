/**
 * PUNT FINANCE — ResultCard Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure presentational component. Receives a TranslationResult and renders
 * the full "Old Money" styled explanation card.
 *
 * Marked 'use client' only because it uses framer-like CSS animation classes.
 * No data fetching, no state, no effects — purely render logic.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { BookOpen, Zap, Database, ArrowUpRight, Minus } from "lucide-react";
import type { TranslationResult, TermDifficulty }        from "@/types/financial";

/* ── Difficulty config ──────────────────────────────────────────────────── */

interface DifficultyConfig {
  label:    string;
  labelEn:  string;
  color:    string;
  bgColor:  string;
}

const DIFFICULTY_MAP: Record<TermDifficulty, DifficultyConfig> = {
  Mwanzo:  { label: "Mwanzo",  labelEn: "Beginner",     color: "var(--color-forest)",  bgColor: "rgba(27,67,50,0.06)"  },
  Kati:    { label: "Kati",    labelEn: "Intermediate",  color: "var(--color-brass)",   bgColor: "rgba(181,137,42,0.08)" },
  Mtaalam: { label: "Mtaalam", labelEn: "Professional",  color: "var(--color-oxford)",  bgColor: "rgba(0,33,71,0.06)"   },
};

/* ── Sub-components ─────────────────────────────────────────────────────── */

/** Thin section divider with centred label — used between EN / SW panels */
function PanelDivider({ label }: { label: string }) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            "0.75rem",
        margin:         "1.5rem 0",
      }}
      role="separator"
      aria-label={label}
    >
      <span style={{ flex: 1, height: "1px", backgroundColor: "var(--color-divider)" }} />
      <span
        style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.5625rem",
          fontWeight:    600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color:         "var(--color-muted)",
        }}
      >
        {label}
      </span>
      <span style={{ flex: 1, height: "1px", backgroundColor: "var(--color-divider)" }} />
    </div>
  );
}

/** Single metadata row in the card footer ledger */
function LedgerRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: React.ReactNode;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display:         "flex",
        justifyContent:  "space-between",
        alignItems:      "baseline",
        paddingTop:      "0.6rem",
        paddingBottom:   "0.6rem",
        borderBottom:    "1px solid var(--color-divider)",
      }}
    >
      <span
        style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.5625rem",
          fontWeight:    600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         "var(--color-muted)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize:   "0.75rem",
          color:      "var(--color-charcoal)",
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

interface ResultCardProps {
  result: TranslationResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const difficulty = DIFFICULTY_MAP[result.difficulty] ?? DIFFICULTY_MAP.Kati;

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  }).format(new Date(result.generatedAt));

  return (
    <article
      aria-label={`Translation result for: ${result.term}`}
      style={{
        backgroundColor: "var(--color-cream)",
        border:          "1px solid var(--color-divider-dark)",
        borderTop:       "3px solid var(--color-oxford)",
        /* Entrance animation — pure CSS, zero JS runtime cost */
        animation:       "resultFadeIn 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
    >
      <style>{`
        @keyframes resultFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      {/* ── Card Header ──────────────────────────────────────────────── */}
      <header
        style={{
          padding:         "1.5rem 2rem",
          borderBottom:    "1px solid var(--color-divider)",
          backgroundColor: "var(--color-parchment)",
          display:         "flex",
          alignItems:      "flex-start",
          justifyContent:  "space-between",
          gap:             "1rem",
          flexWrap:        "wrap",
        }}
      >
        {/* Term names */}
        <div style={{ flex: 1, minWidth: "0" }}>
          {/* Swahili term — primary */}
          <p
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5625rem",
              fontWeight:    600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         "var(--color-brass)",
              marginBottom:  "0.3rem",
            }}
          >
            Kiswahili
          </p>
          <h2
            style={{
              fontFamily:   "var(--font-serif)",
              fontSize:     "clamp(1.25rem, 3vw, 1.75rem)",
              fontWeight:   500,
              color:        "var(--color-oxford)",
              lineHeight:   1.15,
              marginBottom: "0.5rem",
            }}
          >
            {result.termSwahili}
          </h2>
          {/* English term — secondary */}
          <p
            style={{
              fontFamily:   "var(--font-sans)",
              fontSize:     "0.875rem",
              fontStyle:    "italic",
              color:        "var(--color-slate)",
            
            }}
          >
            {result.term}
          </p>
        </div>

        {/* Metadata badges — top right */}
        <div
          style={{
            display:    "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap:        "0.5rem",
            flexShrink: 0,
          }}
        >
          {/* Difficulty badge */}
          <span
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5625rem",
              fontWeight:    600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color:         difficulty.color,
              border:        `1px solid ${difficulty.color}`,
              padding:       "0.2rem 0.6rem",
              backgroundColor: difficulty.bgColor,
            }}
            aria-label={`Difficulty: ${difficulty.label} (${difficulty.labelEn})`}
          >
            {difficulty.label} · {difficulty.labelEn}
          </span>

          {/* Category badge */}
          <span
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5625rem",
              fontWeight:    500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color:         "var(--color-muted)",
              border:        "1px solid var(--color-divider-dark)",
              padding:       "0.2rem 0.6rem",
            }}
            aria-label={`Category: ${result.category}`}
          >
            {result.category}
          </span>

          {/* Cache provenance badge */}
          <span
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5rem",
              fontWeight:    500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display:       "flex",
              alignItems:    "center",
              gap:           "0.3rem",
              color:         result.cached ? "var(--color-forest)" : "var(--color-brass)",
            }}
            aria-label={result.cached ? "Retrieved from ledger cache" : "Freshly generated by AI"}
          >
            {result.cached
              ? <><Database size={9} aria-hidden="true" /> From Ledger</>
              : <><Zap       size={9} aria-hidden="true" /> AI Generated</>
            }
          </span>
        </div>
      </header>

      {/* ── Card Body ────────────────────────────────────────────────── */}
      <div style={{ padding: "1.75rem 2rem" }}>

        {/* English explanation */}
        <section aria-labelledby="result-en-label">
          <p
            id="result-en-label"
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5625rem",
              fontWeight:    600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color:         "var(--color-muted)",
              marginBottom:  "0.75rem",
              display:       "flex",
              alignItems:    "center",
              gap:           "0.5rem",
            }}
          >
            <span
              style={{
                display:         "inline-block",
                width:           "1.25rem",
                height:          "1px",
                backgroundColor: "var(--color-brass)",
              }}
              aria-hidden="true"
            />
            English Explanation
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize:   "0.9375rem",
              color:      "var(--color-charcoal)",
              lineHeight: 1.8,
            }}
          >
            {result.explanationEn}
          </p>
        </section>

        <PanelDivider label="Tafsiri ya Kiswahili · Swahili Translation" />

        {/* Swahili explanation */}
        <section aria-labelledby="result-sw-label">
          <p
            id="result-sw-label"
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5625rem",
              fontWeight:    600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color:         "var(--color-muted)",
              marginBottom:  "0.75rem",
              display:       "flex",
              alignItems:    "center",
              gap:           "0.5rem",
            }}
          >
            <span
              style={{
                display:         "inline-block",
                width:           "1.25rem",
                height:          "1px",
                backgroundColor: "var(--color-oxford)",
              }}
              aria-hidden="true"
            />
            Maelezo ya Kiswahili
          </p>
          <p
            style={{
              fontFamily:      "var(--font-serif)",
              fontSize:        "0.9375rem",
              fontStyle:       "italic",
              color:           "var(--color-oxford)",
              lineHeight:      1.85,
              backgroundColor: "rgba(0,33,71,0.025)",
              padding:         "1.25rem 1.5rem",
              borderLeft:      "2px solid var(--color-oxford)",
            }}
            lang="sw"
          >
            {result.explanationSw}
          </p>
        </section>
      </div>

      {/* ── Card Footer — Ledger Metadata ────────────────────────────── */}
      <footer
        style={{
          padding:         "0 2rem 1.5rem",
          borderTop:       "1px solid var(--color-divider)",
          paddingTop:      "1.25rem",
        }}
        aria-label="Term metadata"
      >
        <p
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5625rem",
            fontWeight:    600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         "var(--color-muted)",
            marginBottom:  "0.25rem",
          }}
        >
          Ledger Entry
        </p>

        <div role="list" aria-label="Term metadata fields">
          <div role="listitem">
            <LedgerRow
              label="Term"
              value={result.term}
              valueStyle={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            />
          </div>
          <div role="listitem">
            <LedgerRow label="Category" value={result.category} />
          </div>
          <div role="listitem">
            <LedgerRow
              label="Added to Ledger"
              value={
                <time dateTime={result.generatedAt}>{formattedDate}</time>
              }
            />
          </div>
          <div role="listitem">
            <LedgerRow
              label="Times Referenced"
              value={result.searchCount.toLocaleString("en-GB")}
            />
          </div>
          <div role="listitem">
            <LedgerRow
              label="Source"
              value={result.cached ? "Punt Finance Ledger" : "AI · Anthropic Claude"}
            />
          </div>
        </div>

        {/* Disclaimer + share action row */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            marginTop:      "1rem",
            flexWrap:       "wrap",
            gap:            "0.75rem",
          }}
        >
          <p
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.5625rem",
              color:         "var(--color-muted)",
              letterSpacing: "0.06em",
              maxWidth:      "28rem",
            }}
          >
            For educational purposes only. Not financial advice.
            Kwa madhumuni ya elimu pekee. Si ushauri wa fedha.
          </p>
          <a
            href={`/glossary/${encodeURIComponent(result.term.toLowerCase().replace(/\s+/g, "-"))}`}
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.6875rem",
              letterSpacing: "0.08em",
              color:         "var(--color-charcoal)",
              borderBottom:  "1px solid var(--color-brass)",
              paddingBottom: "1px",
              display:       "flex",
              alignItems:    "center",
              gap:           "0.3rem",
              transition:    "color 180ms",
              textDecoration: "none",
            }}
            aria-label={`View full glossary entry for ${result.term}`}
          >
            <BookOpen size={10} aria-hidden="true" />
            Full Entry
            <ArrowUpRight size={9} aria-hidden="true" />
          </a>
        </div>
      </footer>
    </article>
  );
}
