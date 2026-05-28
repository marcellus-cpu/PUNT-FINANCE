/**
 * PUNT FINANCE — ResultSkeleton Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Displayed while the Server Action is in-flight.
 * Pure CSS animation — no JS animation library required.
 *
 * The skeleton mirrors the exact visual structure of ResultCard so the
 * layout shift on load is imperceptible.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

/* ── Skeleton primitive ─────────────────────────────────────────────────── */

interface SkeletonLineProps {
  width?:        string;
  height?:       string;
  marginBottom?: string;
  style?:        React.CSSProperties;
}

function SkeletonLine({
  width        = "100%",
  height       = "0.875rem",
  marginBottom = "0.5rem",
  style,
}: SkeletonLineProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        height,
        marginBottom,
        backgroundColor: "var(--color-vellum)",
        borderRadius:    "1px",
        animation:       "skeletonPulse 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

/* ── Skeleton block ─────────────────────────────────────────────────────── */

function SkeletonBlock({
  height = "3rem",
  style,
}: {
  height?: string;
  style?:  React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width:           "100%",
        height,
        backgroundColor: "rgba(0,33,71,0.04)",
        borderLeft:      "2px solid var(--color-divider-dark)",
        padding:         "0.75rem 1rem",
        animation:       "skeletonPulse 1.6s ease-in-out infinite",
        animationDelay:  "200ms",
        ...style,
      }}
    />
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export function ResultSkeleton() {
  return (
    <div
      role="status"
      aria-label="Translating financial term — please wait"
      aria-live="polite"
      style={{
        backgroundColor: "var(--color-cream)",
        border:          "1px solid var(--color-divider-dark)",
        borderTop:       "3px solid var(--color-oxford)",
      }}
    >
      {/* Keyframe injection */}
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1;    }
          50%       { opacity: 0.45; }
        }
      `}</style>

      {/* ── Skeleton Header ────────────────────────────────────────────
          Mirrors: Swahili label + large term heading + EN term subtitle  */}
      <div
        style={{
          padding:         "1.5rem 2rem",
          borderBottom:    "1px solid var(--color-divider)",
          backgroundColor: "var(--color-parchment)",
          display:         "flex",
          justifyContent:  "space-between",
          alignItems:      "flex-start",
          gap:             "1.5rem",
        }}
      >
        {/* Left: term names */}
        <div style={{ flex: 1 }}>
          <SkeletonLine width="4rem"  height="0.6rem" marginBottom="0.6rem" />
          <SkeletonLine width="70%"   height="1.5rem" marginBottom="0.75rem" />
          <SkeletonLine width="40%"   height="0.875rem" />
        </div>

        {/* Right: badges */}
        <div
          style={{
            display:       "flex",
            flexDirection: "column",
            alignItems:    "flex-end",
            gap:           "0.5rem",
            flexShrink:    0,
          }}
        >
          <SkeletonLine width="6rem"  height="1.375rem" marginBottom="0" />
          <SkeletonLine width="4.5rem" height="1.375rem" marginBottom="0" />
          <SkeletonLine width="5rem"  height="0.9rem"   marginBottom="0" />
        </div>
      </div>

      {/* ── Skeleton Body ──────────────────────────────────────────────── */}
      <div style={{ padding: "1.75rem 2rem" }}>

        {/* EN section label */}
        <SkeletonLine width="8rem" height="0.6rem" marginBottom="0.9rem" />

        {/* EN explanation — three lines */}
        <SkeletonLine width="100%" />
        <SkeletonLine width="95%"  />
        <SkeletonLine width="80%"  marginBottom="1.5rem" />

        {/* Divider line with text placeholder */}
        <div
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        "0.75rem",
            margin:     "1.5rem 0",
          }}
        >
          <span style={{ flex: 1, height: "1px", backgroundColor: "var(--color-divider)" }} />
          <SkeletonLine width="9rem" height="0.6rem" marginBottom="0" style={{ flex: "none" }} />
          <span style={{ flex: 1, height: "1px", backgroundColor: "var(--color-divider)" }} />
        </div>

        {/* SW section label */}
        <SkeletonLine width="8rem" height="0.6rem" marginBottom="0.9rem" />

        {/* SW explanation block — italicised ledger style */}
        <SkeletonBlock height="5.5rem" />
      </div>

      {/* ── Skeleton Footer ───────────────────────────────────────────── */}
      <div
        style={{
          padding:     "1.25rem 2rem 1.5rem",
          borderTop:   "1px solid var(--color-divider)",
        }}
      >
        {/* Ledger label */}
        <SkeletonLine width="5rem" height="0.6rem" marginBottom="0.75rem" />

        {/* Ledger rows — 5 rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              display:        "flex",
              justifyContent: "space-between",
              paddingBlock:   "0.6rem",
              borderBottom:   "1px solid var(--color-divider)",
            }}
          >
            <SkeletonLine
              width="4rem"
              height="0.6rem"
              marginBottom="0"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <SkeletonLine
              width="6rem"
              height="0.6rem"
              marginBottom="0"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
        ))}

        {/* Bottom disclaimer row */}
        <div
          style={{
            display:    "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop:  "1rem",
          }}
        >
          <SkeletonLine width="18rem" height="0.625rem" marginBottom="0" />
          <SkeletonLine width="4rem"  height="0.625rem" marginBottom="0" />
        </div>
      </div>

      {/* Screen-reader status message */}
      <p className="sr-only">
        Translating your financial term into Swahili. Consulting the ledger…
      </p>
    </div>
  );
}

/* ── Translating indicator (compact inline version) ─────────────────────── */

/**
 * Used inside the Hero input area when the form is submitted — provides
 * immediate feedback before the skeleton card appears below.
 */
export function TranslatingIndicator() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Processing search"
      style={{
        display:    "flex",
        alignItems: "center",
        gap:        "0.75rem",
        marginTop:  "1.5rem",
      }}
    >
      <style>{`
        @keyframes ledgerDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.85); }
          40%            { opacity: 1;   transform: scale(1);    }
        }
      `}</style>

      {/* Three dot ellipsis in Oxford Blue */}
      {[0, 160, 320].map((delay, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display:         "inline-block",
            width:           "4px",
            height:          "4px",
            borderRadius:    "50%",
            backgroundColor: "var(--color-oxford)",
            animation:       `ledgerDot 1.2s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}

      <span
        style={{
          fontFamily:    "var(--font-serif)",
          fontSize:      "0.875rem",
          fontStyle:     "italic",
          color:         "var(--color-slate)",
          letterSpacing: "0.02em",
        }}
      >
        Consulting the ledger<span aria-hidden="true">…</span>
      </span>

      <p className="sr-only">Translating term into Swahili, please wait.</p>
    </div>
  );
}
