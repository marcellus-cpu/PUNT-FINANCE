/**
 * PUNT FINANCE — DailyLedger Server Component (Phase 3)
 * ─────────────────────────────────────────────────────────────────────────────
 * Async React Server Component. Renders entirely on the server — zero
 * client-side JavaScript for this section.
 *
 * ISR contract:
 *   This component's output is cached by Next.js as part of the page's
 *   ISR segment. The fetchDailyLedger() call inside carries a 6-hour
 *   revalidation window at the fetch + unstable_cache layers, meaning:
 *     • The Alpha Vantage API is called at most 4 times per day.
 *     • The Anthropic API is called only when the AV feed changes.
 *     • All web traffic within the 6-hour window is served from cache.
 *
 * On-demand revalidation (Phase 4):
 *   Call `revalidateTag("daily-ledger")` from a Route Handler or
 *   Vercel cron job to force a fresh fetch ahead of schedule.
 *   Example cron (vercel.json):
 *     { "crons": [{ "path": "/api/revalidate-ledger", "schedule": "0 */6 * * *" }] }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Suspense }              from "react";
import { ArrowUpRight }          from "lucide-react";
import { fetchDailyLedger }      from "@/lib/fetchDailyLedger";
import type {
  LedgerArticle,
  SentimentDirection,
}                                from "@/types/ledger";

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — sentiment accent colours
   Mapped to CSS variables so they respect the global theme.
   ════════════════════════════════════════════════════════════════════════════ */

const SENTIMENT_ACCENT: Record<SentimentDirection, string> = {
  bullish: "var(--color-forest)",   // Muted green — positive signal
  bearish: "#8B2020",               // Muted crimson — negative signal
  neutral: "var(--color-brass)",    // Brass — baseline, no directional signal
};

const SENTIMENT_LABEL: Record<SentimentDirection, string> = {
  bullish: "Chanya",   // Positive (Swahili)
  bearish: "Hasi",     // Negative
  neutral: "Wastani",  // Neutral
};

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — LedgerCard (pure presentational, no state)
   ════════════════════════════════════════════════════════════════════════════ */

function LedgerCard({ article }: { article: LedgerArticle }) {
  const accentColor = SENTIMENT_ACCENT[article.sentiment];

  return (
    <article
      aria-label={`Market news: ${article.headline}`}
      style={{
        backgroundColor: "var(--color-cream)",
        border:          "1px solid var(--color-divider)",
        borderTop:       "none",
        borderLeft:      `3px solid ${accentColor}`,
        padding:         "1.75rem",
        transition:      "border-left-color 250ms ease, background-color 250ms ease",
        height:          "100%",
        display:         "flex",
        flexDirection:   "column",
      }}
    >
      {/* ── Card Header ──────────────────────────────────────────────── */}
      <header
        style={{
          display:        "flex",
          alignItems:     "flex-start",
          justifyContent: "space-between",
          marginBottom:   "1rem",
          gap:            "0.75rem",
        }}
      >
        {/* Ticker + market */}
        <div style={{ minWidth: 0 }}>
          <p
            className="label-fin"
            style={{ color: accentColor, marginBottom: "0.2rem" }}
            aria-label={`Ticker: ${article.ticker}`}
          >
            {article.ticker}
          </p>
          <p
            className="label-fin"
            style={{ color: "var(--color-muted)" }}
            aria-label={`Market: ${article.market}`}
          >
            {article.market}
          </p>
        </div>

        {/* Badges — category + sentiment */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            alignItems:    "flex-end",
            gap:           "0.35rem",
            flexShrink:    0,
          }}
        >
          <span
            className="label-fin"
            style={{
              color:           "var(--color-cream)",
              backgroundColor: "var(--color-oxford)",
              padding:         "0.2rem 0.55rem",
            }}
            aria-label={`Category: ${article.categoryTag}`}
          >
            {article.categoryTag}
          </span>
          <span
            className="label-fin"
            style={{
              color:       accentColor,
              border:      `1px solid ${accentColor}`,
              padding:     "0.15rem 0.45rem",
              fontSize:    "0.5rem",
            }}
            aria-label={`Sentiment: ${SENTIMENT_LABEL[article.sentiment]}`}
          >
            {SENTIMENT_LABEL[article.sentiment]}
          </span>
        </div>
      </header>

      {/* ── Headline — Serif for authority ───────────────────────────── */}
      <h3
        style={{
          fontFamily:   "var(--font-serif)",
          fontSize:     "1.0625rem",
          fontWeight:   500,
          color:        "var(--color-oxford)",
          lineHeight:   1.28,
          marginBottom: "1rem",
          letterSpacing:"-0.01em",
        }}
      >
        {article.headline}
      </h3>

      {/* ── Hairline rule ─────────────────────────────────────────────── */}
      <hr
        className="rule"
        style={{ marginBottom: "1.125rem" }}
        aria-hidden="true"
      />

      {/* ── Swahili bullet points — Sans for data legibility ─────────── */}
      <div
        style={{ flex: 1, marginBottom: "1.5rem" }}
        aria-label="Muhtasari wa Kiswahili — Swahili summary"
        lang="sw"
      >
        {/* Section eyebrow */}
        <p
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5rem",
            fontWeight:    600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         "var(--color-muted)",
            marginBottom:  "0.625rem",
            display:       "flex",
            alignItems:    "center",
            gap:           "0.4rem",
          }}
        >
          <span
            style={{
              display:         "inline-block",
              width:           "1rem",
              height:          "1px",
              backgroundColor: accentColor,
              flexShrink:      0,
            }}
            aria-hidden="true"
          />
          Muhtasari · Kiswahili
        </p>

        {/* Three bullet rows — rendered as a semantic list */}
        <ul
          style={{
            listStyle: "none",
            padding:   0,
            margin:    0,
          }}
          role="list"
        >
          {article.bulletsSw.map((bullet, idx) => (
            <li
              key={idx}
              role="listitem"
              style={{
                display:       "flex",
                alignItems:    "flex-start",
                gap:           "0.6rem",
                paddingBlock:  "0.45rem",
                borderBottom:  idx < 2
                  ? "1px solid var(--color-divider)"
                  : "none",
              }}
            >
              {/* Bullet glyph — a small brass numeral, not a disc */}
              <span
                aria-hidden="true"
                style={{
                  fontFamily:    "var(--font-sans)",
                  fontSize:      "0.5rem",
                  fontWeight:    700,
                  color:         accentColor,
                  letterSpacing: "0.1em",
                  flexShrink:    0,
                  marginTop:     "0.2rem",
                  minWidth:      "0.75rem",
                  textAlign:     "right",
                }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>

              {/* Bullet text */}
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize:   "0.8125rem",
                  color:      "var(--color-charcoal)",
                  lineHeight: 1.7,
                  margin:     0,
                }}
              >
                {bullet}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Card Footer ──────────────────────────────────────────────── */}
      <footer
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          paddingTop:     "0.875rem",
          borderTop:      "1px solid var(--color-divider)",
          marginTop:      "auto",
        }}
      >
        {/* Publication date */}
        <time
          dateTime={article.publishedAt}
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5625rem",
            color:         "var(--color-muted)",
            letterSpacing: "0.06em",
          }}
        >
          {article.publishedDisplay}
        </time>

        {/* "Soma Makala Asili" — Read Original Source */}
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Soma makala asili kutoka ${article.sourceLabel} — inafungua kichupo kipya`}
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5625rem",
            fontWeight:    500,
            letterSpacing: "0.08em",
            color:         "var(--color-charcoal)",
            borderBottom:  "1px solid var(--color-brass)",
            paddingBottom: "1px",
            display:       "flex",
            alignItems:    "center",
            gap:           "0.25rem",
            transition:    "color 180ms ease",
            textDecoration:"none",
            whiteSpace:    "nowrap",
          }}
        >
          Soma Makala Asili
          <ArrowUpRight
            size={9}
            strokeWidth={2}
            aria-hidden="true"
          />
        </a>
      </footer>
    </article>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — LedgerErrorState
   Shown when fetchDailyLedger returns ok: false (should never happen in
   practice because the function returns fallback articles on every error,
   but this handles the defensive case if someone calls it incorrectly).
   ════════════════════════════════════════════════════════════════════════════ */

function LedgerErrorState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        gridColumn:      "1 / -1",
        padding:         "3rem 2rem",
        textAlign:       "center",
        border:          "1px solid var(--color-divider)",
        borderTop:       "none",
        backgroundColor: "var(--color-parchment)",
      }}
    >
      {/* Decorative ornament */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          gap:            "0.75rem",
          marginBottom:   "1.25rem",
        }}
        aria-hidden="true"
      >
        <span
          style={{
            display:         "inline-block",
            width:           "2rem",
            height:          "1px",
            backgroundColor: "var(--color-divider-dark)",
          }}
        />
        <span
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5rem",
            fontWeight:    600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:         "var(--color-muted)",
          }}
        >
          Ledger Update
        </span>
        <span
          style={{
            display:         "inline-block",
            width:           "2rem",
            height:          "1px",
            backgroundColor: "var(--color-divider-dark)",
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontSize:   "1.125rem",
          fontStyle:  "italic",
          fontWeight: 400,
          color:      "var(--color-oxford)",
          lineHeight: 1.5,
          marginBottom:"0.75rem",
        }}
      >
        The daily ledger is currently being updated.
      </p>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize:   "0.8125rem",
          color:      "var(--color-muted)",
          lineHeight: 1.7,
        }}
        lang="sw"
      >
        Taarifa za masoko zinahuishwa. Tafadhali rudi hivi karibuni.
      </p>
      <p
        style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.6875rem",
          color:         "var(--color-slate)",
          lineHeight:    1.7,
          marginTop:     "0.5rem",
        }}
      >
        Please return shortly — market data refreshes every 6 hours.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — LedgerSkeleton
   Shown inside the Suspense boundary while the async RSC resolves.
   Mirrors the exact card structure for zero layout shift on hydration.
   ════════════════════════════════════════════════════════════════════════════ */

function SkeletonPulse({
  width  = "100%",
  height = "0.875rem",
  delay  = "0ms",
}: {
  width?:  string;
  height?: string;
  delay?:  string;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        backgroundColor: "var(--color-vellum)",
        animation:       `skeletonPulse 1.8s ease-in-out ${delay} infinite`,
        borderRadius:    "1px",
        marginBottom:    "0.5rem",
      }}
    />
  );
}

function LedgerCardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-cream)",
        border:          "1px solid var(--color-divider)",
        borderTop:       "none",
        borderLeft:      "3px solid var(--color-vellum)",
        padding:         "1.75rem",
        height:          "100%",
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <SkeletonPulse width="3.5rem" height="0.55rem" />
          <SkeletonPulse width="4.5rem" height="0.55rem" delay="80ms" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end" }}>
          <SkeletonPulse width="4rem" height="1.1rem" />
          <SkeletonPulse width="3rem" height="0.9rem" delay="100ms" />
        </div>
      </div>

      {/* Headline — two lines */}
      <SkeletonPulse height="1rem"   delay="40ms"  />
      <SkeletonPulse width="85%" height="1rem" delay="80ms" />
      <div style={{ height: "1px", backgroundColor: "var(--color-divider)", margin: "1rem 0" }} />

      {/* Section label */}
      <SkeletonPulse width="6rem" height="0.55rem" delay="60ms" />

      {/* Three bullet rows */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display:      "flex",
            gap:          "0.6rem",
            paddingBlock: "0.45rem",
            borderBottom: i < 2 ? "1px solid var(--color-divider)" : "none",
          }}
        >
          <SkeletonPulse width="0.75rem" height="0.55rem" delay={`${i * 60}ms`} />
          <div style={{ flex: 1 }}>
            <SkeletonPulse height="0.75rem" delay={`${i * 60 + 30}ms`} />
            <SkeletonPulse width="75%" height="0.75rem" delay={`${i * 60 + 60}ms`} />
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.875rem" }}>
        <SkeletonPulse width="5rem" height="0.55rem" />
        <SkeletonPulse width="6rem" height="0.55rem" delay="80ms" />
      </div>
    </div>
  );
}

export function LedgerSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading market news"
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        borderTop:           "1px solid var(--color-divider)",
      }}
    >
      {[0, 1, 2].map((i) => (
        <LedgerCardSkeleton key={i} />
      ))}
      <p className="sr-only">Loading latest market news. Please wait.</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — LiveLedgerGrid  (async RSC — the inner Suspense child)
   Fetches data and renders cards. Wrapped in Suspense by DailyLedger below.
   ════════════════════════════════════════════════════════════════════════════ */

async function LiveLedgerGrid() {
  const result = await fetchDailyLedger();

  /* fetchDailyLedger always returns ok: true (fallback covers all failures),
     but we handle ok: false defensively for strict type safety.             */
  if (!result.ok) {
    return <LedgerErrorState />;
  }

  const { articles, fetchedAt, isFallback } = result;

  /* Format the cache timestamp for the freshness strip */
  const freshnessCopy = isFallback
    ? "Serving editorial content · Live data temporarily unavailable"
    : `Data current as of ${new Intl.DateTimeFormat("en-GB", {
        day:      "2-digit",
        month:    "short",
        year:     "numeric",
        hour:     "2-digit",
        minute:   "2-digit",
        timeZone: "UTC",
        hour12:   false,
      }).format(new Date(fetchedAt))} UTC · Refreshes every 6 hours`;

  return (
    <>
      {/* News card grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0"
        role="list"
        aria-label="Habari za hivi karibuni za masoko — Latest market news"
        style={{ borderTop: "1px solid var(--color-divider)" }}
      >
        {articles.map((article) => (
          <div
            key={article.id}
            role="listitem"
            /* Stretch card to fill grid cell height for visual alignment */
            style={{ display: "flex", flexDirection: "column" }}
          >
            <LedgerCard article={article} />
          </div>
        ))}
      </div>

      {/* Freshness strip */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginTop:      "1.125rem",
          flexWrap:       "wrap",
          gap:            "0.5rem",
        }}
      >
        <p
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5625rem",
            color:         isFallback ? "var(--color-brass)" : "var(--color-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
          aria-label={`Data freshness: ${freshnessCopy}`}
        >
          {isFallback && (
            <span
              style={{
                display:         "inline-block",
                width:           "5px",
                height:          "5px",
                borderRadius:    "50%",
                backgroundColor: "var(--color-brass)",
                marginRight:     "0.4rem",
                verticalAlign:   "middle",
              }}
              aria-hidden="true"
            />
          )}
          {freshnessCopy}
        </p>

        <p
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.5625rem",
            color:         "var(--color-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {/* Source attribution — always shown */}
          {isFallback ? "Source · Punt Finance Editorial" : "Source · Alpha Vantage · Anthropic Claude"}
        </p>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT — DailyLedger  (exported — used in page.tsx)
   The outer shell: section chrome + Suspense boundary.
   ════════════════════════════════════════════════════════════════════════════ */

export async function DailyLedger() {
  return (
    <section
      id="ledger"
      aria-labelledby="ledger-heading"
      style={{ borderBottom: "1px solid var(--color-divider)" }}
      className="w-full"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-20 sm:py-24">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div
          className="flex items-end justify-between mb-10"
          style={{
            borderBottom: "1px solid var(--color-divider-dark)",
            paddingBottom: "1.25rem",
          }}
        >
          <div>
            <p
              className="label-fin mb-2"
              style={{ color: "var(--color-muted)" }}
            >
              §01 — International Markets
            </p>
            <h2
              id="ledger-heading"
              style={{
                fontFamily:    "var(--font-serif)",
                fontSize:      "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight:    400,
                color:         "var(--color-oxford)",
                letterSpacing: "-0.01em",
              }}
            >
              The Daily Ledger
            </h2>
          </div>

          <a
            href="/markets"
            className="label-fin hidden sm:flex items-center gap-1.5"
            style={{ color: "var(--color-brass)" }}
            aria-label="View all market news"
          >
            View All
            <ArrowUpRight size={10} strokeWidth={2.5} aria-hidden="true" />
          </a>
        </div>

        {/*
         * Suspense boundary — shows LedgerSkeleton while LiveLedgerGrid
         * resolves its async data fetching. Because this is an RSC, the
         * skeleton renders on the server as a static HTML placeholder
         * and is swapped out by React's streaming architecture as the
         * async data arrives — no client-side loading state needed.
         */}
        <Suspense fallback={<LedgerSkeleton />}>
          <LiveLedgerGrid />
        </Suspense>
      </div>
    </section>
  );
}
