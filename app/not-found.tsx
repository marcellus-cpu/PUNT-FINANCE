/**
 * PUNT FINANCE — Not Found Page (app/not-found.tsx)
 * ─────────────────────────────────────────────────────────────────────────────
 * Rendered by Next.js when notFound() is called in a Server Component,
 * or when no route matches the requested URL.
 *
 * Unlike error.tsx, this is a pure React Server Component — no client-side
 * JavaScript needed. The "Return to the Main Ledger" button is a plain <a>
 * tag, not a client router push.
 *
 * Aesthetic contract:
 *   The page presents as a beautifully typeset ledger entry for a term that
 *   does not appear in the index — the absence of a record, not an error.
 *   Ivory background, Oxford Blue serif, brass accent, 1px rule throughout.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from "next";

/* ── Metadata ───────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Entry Not Found · Punt Finance",
  description:
    "The page or financial term you requested does not appear in our ledger. " +
    "Return to the main index to continue your consultation.",
  robots: {
    index:  false,   // Never index 404 pages
    follow: false,
  },
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function NotFound() {
  return (
    <div
      style={{
        minHeight:       "100vh",
        backgroundColor: "#FAF9F6",    // --color-cream
        display:         "flex",
        flexDirection:   "column",
        fontFamily:      "var(--font-inter), system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Top accent rule ──────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          width:      "100%",
          height:     "3px",
          background: "linear-gradient(to right, #002147, #B5892A, #002147)",
        }}
      />

      {/* ── Minimal header ────────────────────────────────────────────── */}
      <header
        style={{
          padding:         "1.125rem 2rem",
          borderBottom:    "1px solid #E2DDD5",
          backgroundColor: "rgba(250,249,246,0.96)",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
        }}
      >
        <a
          href="/"
          style={{
            display:        "flex",
            alignItems:     "baseline",
            gap:            "0.5rem",
            textDecoration: "none",
          }}
          aria-label="Punt Finance — Return to home"
        >
          <span
            style={{
              fontFamily:    "Georgia, serif",
              fontSize:      "1.25rem",
              fontWeight:    700,
              color:         "#B5892A",
              letterSpacing: "-0.03em",
              lineHeight:    1,
            }}
            aria-hidden="true"
          >
            ₱
          </span>
          <span
            style={{
              fontFamily:    "Georgia, serif",
              fontSize:      "1rem",
              fontWeight:    600,
              color:         "#002147",
              letterSpacing: "0.04em",
            }}
          >
            Punt Finance
          </span>
        </a>

        <span
          style={{
            fontFamily:    "system-ui, sans-serif",
            fontSize:      "0.5625rem",
            fontWeight:    600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         "#7A7369",
          }}
        >
          Page Not Found
        </span>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main
        role="main"
        style={{
          flex:           1,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "3rem 1.5rem",
        }}
      >
        {/* Ledger card */}
        <div
          style={{
            maxWidth:        "36rem",
            width:           "100%",
            backgroundColor: "#F4EFE6",    // --color-parchment
            border:          "1px solid #E2DDD5",
            borderTop:       "3px solid #002147",
            padding:         "clamp(2rem, 5vw, 3rem)",
          }}
        >
          {/* Ledger header row */}
          <div
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "space-between",
              paddingBottom:   "1rem",
              borderBottom:    "1px solid #E2DDD5",
              marginBottom:    "1.75rem",
            }}
          >
            {/* Section label */}
            <div>
              <p
                style={{
                  fontFamily:    "system-ui, sans-serif",
                  fontSize:      "0.5rem",
                  fontWeight:    600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color:         "#7A7369",
                  marginBottom:  "0.2rem",
                }}
              >
                Ledger Entry
              </p>
              <p
                style={{
                  fontFamily:    "system-ui, sans-serif",
                  fontSize:      "0.5rem",
                  fontWeight:    600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color:         "#B5892A",
                }}
              >
                Status · Not Indexed
              </p>
            </div>

            {/* Entry number badge */}
            <span
              style={{
                fontFamily:    "system-ui, sans-serif",
                fontSize:      "0.5rem",
                fontWeight:    600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color:         "#FAF9F6",
                backgroundColor: "#002147",
                padding:       "0.2rem 0.6rem",
              }}
              aria-label="HTTP status code 404"
            >
              404
            </span>
          </div>

          {/* Ornamental rule */}
          <div
            aria-hidden="true"
            style={{
              display:        "flex",
              alignItems:     "center",
              gap:            "0.75rem",
              marginBottom:   "1.75rem",
              justifyContent: "center",
            }}
          >
            <span style={{ flex: 1, height: "1px", backgroundColor: "#E2DDD5" }} />
            <span
              style={{
                fontFamily:    "system-ui, sans-serif",
                fontSize:      "0.5rem",
                fontWeight:    600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color:         "#7A7369",
                flexShrink:    0,
              }}
            >
              Entry Not Found · Hazipatikani
            </span>
            <span style={{ flex: 1, height: "1px", backgroundColor: "#E2DDD5" }} />
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily:    "Georgia, 'Times New Roman', serif",
              fontSize:      "clamp(1.375rem, 3.5vw, 1.875rem)",
              fontWeight:    400,
              color:         "#002147",
              lineHeight:    1.18,
              letterSpacing: "-0.02em",
              marginBottom:  "1rem",
            }}
          >
            This Entry Does Not Appear{" "}
            <em style={{ fontStyle: "italic" }}>in Our Ledger</em>
          </h1>

          {/* Brass rule */}
          <div
            aria-hidden="true"
            style={{
              width:           "2.5rem",
              height:          "1px",
              backgroundColor: "#B5892A",
              marginBottom:    "1.25rem",
            }}
          />

          {/* Body copy — English */}
          <p
            style={{
              fontFamily:   "system-ui, -apple-system, sans-serif",
              fontSize:     "0.9375rem",
              color:        "#4A4A4A",
              lineHeight:   1.8,
              marginBottom: "0.875rem",
            }}
          >
            The page or record you have requested does not appear in our index.
            It may have been removed, relocated, or may never have been recorded
            in this ledger.
          </p>

          {/* Body copy — Swahili */}
          <p
            lang="sw"
            style={{
              fontFamily:      "Georgia, serif",
              fontSize:        "0.875rem",
              fontStyle:       "italic",
              color:           "#7A7369",
              lineHeight:      1.75,
              marginBottom:    "2rem",
              backgroundColor: "rgba(0,33,71,0.025)",
              padding:         "0.875rem 1rem",
              borderLeft:      "2px solid #B5892A",
            }}
          >
            Ukurasa au rekodi uliyoomba haupo katika kumbukumbu zetu. Labda
            ulihamishwa au haukuwahi kuandikwa. Rudi kwenye orodha kuu ili
            kuendelea na utafutaji wako.
          </p>

          {/* Ledger metadata rows */}
          <div
            style={{ marginBottom: "2rem" }}
            role="list"
            aria-label="Entry details"
          >
            {[
              { label: "Requested Entry", value: "Not on record" },
              { label: "Index Status",    value: "Unregistered"  },
              { label: "Recommendation",  value: "Return to main index" },
            ].map(({ label, value }) => (
              <div
                key={label}
                role="listitem"
                style={{
                  display:        "flex",
                  justifyContent: "space-between",
                  alignItems:     "baseline",
                  paddingBlock:   "0.55rem",
                  borderBottom:   "1px solid #E2DDD5",
                }}
              >
                <span
                  style={{
                    fontFamily:    "system-ui, sans-serif",
                    fontSize:      "0.5rem",
                    fontWeight:    600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color:         "#7A7369",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: "system-ui, sans-serif",
                    fontSize:   "0.75rem",
                    color:      "#2C2C2C",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display:       "flex",
              flexDirection: "column",
              gap:           "0.75rem",
              alignItems:    "center",
            }}
          >
            {/* Primary CTA */}
            <a
              href="/"
              style={{
                fontFamily:      "system-ui, -apple-system, sans-serif",
                fontSize:        "0.6875rem",
                fontWeight:      600,
                letterSpacing:   "0.16em",
                textTransform:   "uppercase",
                backgroundColor: "#002147",
                color:           "#FAF9F6",
                border:          "1px solid #002147",
                padding:         "0.65rem 2.25rem",
                display:         "inline-block",
                textDecoration:  "none",
                width:           "100%",
                maxWidth:        "18rem",
                boxSizing:       "border-box",
                textAlign:       "center",
                transition:      "background-color 220ms, color 220ms",
              }}
              aria-label="Return to the Punt Finance main ledger"
            >
              Return to the Main Ledger
            </a>

            {/* Secondary: search */}
            <a
              href="/#hero-heading"
              style={{
                fontFamily:    "system-ui, -apple-system, sans-serif",
                fontSize:      "0.6875rem",
                fontWeight:    500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color:         "#002147",
                border:        "1px solid #E2DDD5",
                padding:       "0.65rem 2.25rem",
                display:       "inline-block",
                textDecoration:"none",
                width:         "100%",
                maxWidth:      "18rem",
                boxSizing:     "border-box",
                textAlign:     "center",
              }}
              aria-label="Search the financial glossary"
            >
              Search the Glossary · Tafuta
            </a>
          </div>
        </div>
      </main>

      {/* ── Footer strip ─────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop:       "1px solid #E2DDD5",
          padding:         "1rem 2rem",
          display:         "flex",
          justifyContent:  "space-between",
          alignItems:      "center",
          backgroundColor: "#002147",
          flexWrap:        "wrap",
          gap:             "0.5rem",
        }}
        aria-label="Page footer"
      >
        <p
          style={{
            fontFamily:    "system-ui, sans-serif",
            fontSize:      "0.5625rem",
            color:         "rgba(250,249,246,0.45)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          © {new Date().getFullYear()} Punt Finance · For educational purposes only
        </p>
        <p
          style={{
            fontFamily:    "system-ui, sans-serif",
            fontSize:      "0.5625rem",
            color:         "rgba(250,249,246,0.3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Phase 4 · Security & Launch
        </p>
      </footer>
    </div>
  );
}
