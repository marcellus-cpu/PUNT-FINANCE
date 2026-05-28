/**
 * PUNT FINANCE — Global Error Boundary (app/error.tsx)
 * ─────────────────────────────────────────────────────────────────────────────
 * Next.js App Router error boundary. Must be a Client Component — Next.js
 * requires this because React's error boundary mechanism uses lifecycle
 * methods (componentDidCatch) that only exist on the client.
 *
 * This component catches uncaught errors thrown by any Server Component,
 * Client Component, or Server Action within the same route segment, and
 * renders an elegant recovery page in place of a crash screen.
 *
 * Aesthetic contract:
 *   The page must look like a beautifully printed apology card from a
 *   high-end private concierge — understated, authoritative, never alarming.
 *   Ivory background, Oxford Blue serif typography, brass accent, 1px rule.
 *   No stack traces, no "500 Internal Server Error", no technical jargon.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect } from "react";

/* ── Props contract (Next.js App Router error boundary spec) ─────────────── */

interface ErrorPageProps {
  /** The thrown error object — may be Error or an unknown value */
  error:  Error & { digest?: string };
  /** Provided by Next.js — call to attempt re-rendering the segment */
  reset:  () => void;
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function GlobalError({ error, reset }: ErrorPageProps) {
  /* Log to the server-side error monitoring service.
     In production, replace console.error with your APM SDK call:
       Sentry.captureException(error);
       Datadog.logger.error("Unhandled route error", { digest: error.digest });  */
  useEffect(() => {
    console.error("[PuntFinance] Unhandled route error:", {
      message: error.message,
      digest:  error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin:          0,
          padding:         0,
          backgroundColor: "#FAF9F6",  // --color-cream
          fontFamily:      "Georgia, 'Times New Roman', serif",
          minHeight:       "100vh",
          display:         "flex",
          flexDirection:   "column",
        }}
      >
        {/* ── Thin top rule — brand mark ───────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            width:           "100%",
            height:          "3px",
            background:      "linear-gradient(to right, #002147, #B5892A, #002147)",
          }}
        />

        {/* ── Main content — the apology card ──────────────────────────── */}
        <main
          role="main"
          style={{
            flex:           1,
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "3rem 1.5rem",
            textAlign:      "center",
          }}
        >
          {/* Card container */}
          <div
            style={{
              maxWidth:        "34rem",
              width:           "100%",
              backgroundColor: "#F4EFE6",    // --color-parchment
              border:          "1px solid #E2DDD5",  // --color-divider
              padding:         "clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            {/* Monogram */}
            <p
              aria-hidden="true"
              style={{
                fontFamily:    "Georgia, serif",
                fontSize:      "2rem",
                fontWeight:    700,
                color:         "#B5892A",    // --color-brass
                lineHeight:    1,
                marginBottom:  "1.5rem",
                letterSpacing: "-0.03em",
              }}
            >
              ₱
            </p>

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
              <span style={{ flex: 1, height: "1px", maxWidth: "3rem", backgroundColor: "#E2DDD5" }} />
              <span
                style={{
                  fontFamily:    "Georgia, serif",
                  fontSize:      "0.5rem",
                  fontWeight:    600,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color:         "#7A7369",   // --color-muted
                }}
              >
                Our Sincerest Apologies
              </span>
              <span style={{ flex: 1, height: "1px", maxWidth: "3rem", backgroundColor: "#E2DDD5" }} />
            </div>

            {/* Heading */}
            <h1
              style={{
                fontFamily:    "Georgia, 'Times New Roman', serif",
                fontSize:      "clamp(1.375rem, 3.5vw, 1.875rem)",
                fontWeight:    400,
                color:         "#002147",    // --color-oxford
                lineHeight:    1.2,
                letterSpacing: "-0.02em",
                marginBottom:  "1.25rem",
              }}
            >
              The Ledger Has Encountered
              <br />
              <em style={{ fontStyle: "italic" }}>a Momentary Difficulty</em>
            </h1>

            {/* Divider */}
            <div
              aria-hidden="true"
              style={{
                width:           "2.5rem",
                height:          "1px",
                backgroundColor: "#B5892A",
                margin:          "0 auto 1.25rem",
              }}
            />

            {/* Body copy — English */}
            <p
              style={{
                fontFamily:   "system-ui, -apple-system, sans-serif",
                fontSize:     "0.9375rem",
                color:        "#4A4A4A",     // --color-slate
                lineHeight:   1.8,
                marginBottom: "0.75rem",
              }}
            >
              We regret that an unexpected difficulty has interrupted your
              consultation. Our systems are attended to at all times, and
              this matter will be resolved promptly.
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
                textAlign:       "left",
              }}
            >
              Tunajuta kwa usumbufu huu. Mfumo wetu unashughulikiwa, na tatizo
              hili litatatuliwa haraka. Tafadhali jaribu tena baada ya muda mfupi.
            </p>

            {/* Error digest — safe to show; contains no sensitive data */}
            {error.digest && (
              <p
                style={{
                  fontFamily:    "system-ui, sans-serif",
                  fontSize:      "0.5625rem",
                  color:         "#7A7369",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom:  "1.75rem",
                }}
                aria-label={`Error reference: ${error.digest}`}
              >
                Reference · {error.digest}
              </p>
            )}

            {/* Action buttons */}
            <div
              style={{
                display:    "flex",
                flexDirection: "column",
                gap:        "0.75rem",
                alignItems: "center",
              }}
            >
              {/* Primary: retry — calls Next.js reset() */}
              <button
                onClick={reset}
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
                  cursor:          "pointer",
                  width:           "100%",
                  maxWidth:        "16rem",
                  transition:      "background-color 220ms, color 220ms",
                }}
                aria-label="Attempt to reload this page section"
              >
                Attempt Again · Jaribu Tena
              </button>

              {/* Secondary: return home */}
              <a
                href="/"
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
                  maxWidth:      "16rem",
                  boxSizing:     "border-box",
                  transition:    "border-color 180ms",
                }}
                aria-label="Return to the Punt Finance main ledger"
              >
                Return to the Main Ledger
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <p
            style={{
              fontFamily:    "system-ui, sans-serif",
              fontSize:      "0.5625rem",
              color:         "#7A7369",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop:     "1.75rem",
            }}
          >
            For educational purposes only · Not financial advice
          </p>
        </main>

        {/* ── Bottom rule ──────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            width:           "100%",
            height:          "1px",
            backgroundColor: "#E2DDD5",
          }}
        />
      </body>
    </html>
  );
}
