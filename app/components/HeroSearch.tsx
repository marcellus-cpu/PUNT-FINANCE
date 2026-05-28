/**
 * PUNT FINANCE — HeroSearch Client Component
 * ─────────────────────────────────────────────────────────────────────────────
 * The only client-side interactive piece of the page.
 * Minimal surface area: manages form state + renders results.
 * Zero external data fetching — all I/O goes through the Server Action.
 *
 * State machine:
 *   idle         → initial / after reset
 *   pending      → form submitted, action in-flight
 *   success      → TranslationResult received, ResultCard rendered
 *   error        → generic server or AI error
 *   rate_limited → user has exceeded the search budget
 *   invalid_input → sanitisation rejected the query
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState as useActionState } from "react-dom";
import { Search, X, AlertCircle, Clock }               from "lucide-react";
import { translateTerm }                               from "@/app/actions/translateTerm";
import { ResultCard }                                  from "@/app/components/ResultCard";
import { ResultSkeleton, TranslatingIndicator }        from "@/app/components/ResultSkeleton";
import type { TranslateState }                         from "@/types/financial";

/* ── Initial idle state ─────────────────────────────────────────────────── */
const INITIAL_STATE: TranslateState = { status: "idle" };

/* ── Sub-component: Error banner ────────────────────────────────────────── */

function ErrorBanner({
  message,
  isRateLimit,
  retryAfterMs,
}: {
  message:       string;
  isRateLimit:   boolean;
  retryAfterMs?: number;
}) {
  /* Live countdown for rate-limit banners */
  const [secondsLeft, setSecondsLeft] = useState<number>(
    retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 0
  );

  useEffect(() => {
    if (!isRateLimit || !retryAfterMs) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRateLimit, retryAfterMs]);

  const Icon = isRateLimit ? Clock : AlertCircle;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display:         "flex",
        alignItems:      "flex-start",
        gap:             "0.75rem",
        marginTop:       "1.25rem",
        padding:         "1rem 1.25rem",
        border:          "1px solid var(--color-divider-dark)",
        borderLeft:      isRateLimit
          ? "3px solid var(--color-brass)"
          : "3px solid #b91c1c",
        backgroundColor: isRateLimit
          ? "rgba(181,137,42,0.05)"
          : "rgba(185,28,28,0.04)",
        animation:       "resultFadeIn 300ms ease both",
      }}
    >
      <style>{`@keyframes resultFadeIn { from { opacity:0; transform:translateY(6px);} to { opacity:1; transform:translateY(0); }}`}</style>

      <Icon
        size={14}
        strokeWidth={1.5}
        aria-hidden="true"
        style={{
          color:     isRateLimit ? "var(--color-brass)" : "#b91c1c",
          flexShrink: 0,
          marginTop: "2px",
        }}
      />

      <div>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "0.875rem",
            color:      "var(--color-charcoal)",
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>
        {isRateLimit && secondsLeft > 0 && (
          <p
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "0.75rem",
              color:         "var(--color-muted)",
              marginTop:     "0.35rem",
              letterSpacing: "0.04em",
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            Ready in{" "}
            <strong style={{ color: "var(--color-brass)", fontVariantNumeric: "tabular-nums" }}>
              {secondsLeft}s
            </strong>
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Sub-component: Suggested terms ─────────────────────────────────────── */

const SUGGESTED_TERMS = [
  "Short Selling",
  "Quantitative Easing",
  "Yield Curve Inversion",
  "Hedge Fund Alpha",
  "NSE 20 Index",
  "Derivatives",
  "P/E Ratio",
  "IPO",
];

function SuggestedTerms({
  onSelect,
  disabled,
}: {
  onSelect:  (term: string) => void;
  disabled:  boolean;
}) {
  return (
    <div
      style={{ marginTop: "1rem" }}
      aria-label="Suggested search terms"
    >
      <p
        style={{
          fontFamily:    "var(--font-sans)",
          fontSize:      "0.5625rem",
          fontWeight:    600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color:         "var(--color-muted)",
          marginBottom:  "0.6rem",
        }}
      >
        Try a term
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {SUGGESTED_TERMS.map((term) => (
          <button
            key={term}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(term)}
            style={{
              fontFamily:      "var(--font-sans)",
              fontSize:        "0.625rem",
              letterSpacing:   "0.1em",
              textTransform:   "uppercase",
              color:           disabled ? "var(--color-muted)" : "var(--color-slate)",
              border:          "1px solid var(--color-divider-dark)",
              padding:         "0.3rem 0.75rem",
              backgroundColor: "transparent",
              cursor:          disabled ? "not-allowed" : "pointer",
              transition:      "color 180ms, border-color 180ms, background-color 180ms",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-oxford)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-oxford)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-slate)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-divider-dark)";
            }}
            aria-label={`Search for ${term}`}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */

export function HeroSearch() {
  /* useActionState wires the Server Action to the form.
     When the form is submitted, `isPending` is true and `state` updates
     after the action resolves. Zero polling, zero fetch() calls.         */
  const [state, action, isPending] = useActionState<TranslateState, FormData>(
    translateTerm,
    INITIAL_STATE
  );

  /* Controlled input — allows programmatic population from suggested terms */
  const [inputValue, setInputValue] = useState("");

  /* Ref to the result card for smooth scroll-into-view after load */
  const resultRef = useRef<HTMLDivElement>(null);

  /* Ref to the input for focus management */
  const inputRef = useRef<HTMLInputElement>(null);

  /* Scroll to result when a successful response arrives */
  useEffect(() => {
    if (state.status === "success" && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.status, state.data]);

  /* Clear input and return focus on reset */
  function handleReset() {
    setInputValue("");
    inputRef.current?.focus();
  }

  /* Populate input from a suggested term chip */
  function handleSuggestedTerm(term: string) {
    setInputValue(term);
    inputRef.current?.focus();
  }

  const showError    = !isPending && (state.status === "error" || state.status === "invalid_input");
  const showRateLimit = !isPending && state.status === "rate_limited";
  const showResult   = !isPending && state.status === "success" && state.data;
  const showSkeleton = isPending;

  return (
    <div className="w-full max-w-2xl" style={{ width: "100%" }}>

      {/* ── Search Form ──────────────────────────────────────────────── */}
      <form
        action={action}
        role="search"
        aria-label="Search for financial terms"
        noValidate
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <label htmlFor="hero-search-input" className="sr-only">
            Search any financial term, equity, or market concept
          </label>

          {/* Search icon */}
          <Search
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{
              position:      "absolute",
              right:         inputValue ? "2.5rem" : "0.125rem",
              color:         isPending ? "var(--color-oxford)" : "var(--color-muted)",
              pointerEvents: "none",
              transition:    "color 200ms",
            }}
          />

          {/* Clear button — visible when input has value */}
          {inputValue && !isPending && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Clear search input"
              style={{
                position:        "absolute",
                right:           "0",
                background:      "none",
                border:          "none",
                cursor:          "pointer",
                padding:         "0.25rem",
                color:           "var(--color-muted)",
                display:         "flex",
                alignItems:      "center",
                transition:      "color 180ms",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-oxford)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-muted)")}
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}

          <input
            ref={inputRef}
            id="hero-search-input"
            name="q"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            maxLength={120}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isPending}
            className="input-search"
            placeholder="Search any financial term, equity, or market concept..."
            aria-describedby="search-hint search-status"
            aria-busy={isPending}
            style={{ paddingRight: inputValue ? "5rem" : "2.5rem" }}
            required
          />
        </div>

        {/* Hint text */}
        <p
          id="search-hint"
          style={{
            fontFamily:    "var(--font-sans)",
            fontSize:      "0.6875rem",
            color:         "var(--color-muted)",
            marginTop:     "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          Jibu litapatikana kwa Kiswahili · Results delivered in Swahili with English annotation
        </p>

        {/* Loading indicator — inline, below input */}
        {isPending && <TranslatingIndicator />}

        {/* Submit button */}
        {!isPending && (
          <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "center" }}>
            <button
              type="submit"
              disabled={isPending || !inputValue.trim()}
              aria-label="Submit financial search"
              style={{
                fontFamily:      "var(--font-sans)",
                fontSize:        "0.6875rem",
                fontWeight:      600,
                letterSpacing:   "0.16em",
                textTransform:   "uppercase",
                backgroundColor: !inputValue.trim() ? "var(--color-vellum)" : "var(--color-oxford)",
                color:           !inputValue.trim() ? "var(--color-muted)" : "var(--color-cream)",
                border:          "1px solid",
                borderColor:     !inputValue.trim() ? "var(--color-divider-dark)" : "var(--color-oxford)",
                padding:         "0.65rem 2.5rem",
                cursor:          !inputValue.trim() ? "not-allowed" : "pointer",
                transition:      "background-color 220ms, color 220ms, border-color 220ms",
              }}
            >
              Simplify · Rahisisha
            </button>
          </div>
        )}

        {/* Screen-reader status region */}
        <p id="search-status" className="sr-only" aria-live="polite" aria-atomic="true">
          {isPending        && "Translating your term. Please wait."}
          {showResult       && `Result found for: ${state.data!.term}`}
          {showError        && state.error}
          {showRateLimit    && state.error}
        </p>
      </form>

      {/* ── Suggested terms ──────────────────────────────────────────── */}
      {state.status === "idle" && (
        <SuggestedTerms onSelect={handleSuggestedTerm} disabled={isPending} />
      )}

      {/* ── Error banners ─────────────────────────────────────────────── */}
      {(showError || showRateLimit) && state.error && (
        <ErrorBanner
          message={state.error}
          isRateLimit={showRateLimit}
          retryAfterMs={state.retryAfterMs}
        />
      )}

      {/* ── Result area ───────────────────────────────────────────────── */}
      <div
        ref={resultRef}
        style={{ marginTop: showSkeleton || showResult ? "2.5rem" : "0" }}
        aria-live="polite"
        aria-atomic="false"
      >
        {showSkeleton && <ResultSkeleton />}
        {showResult   && state.data && (
          <>
            <ResultCard result={state.data} />

            {/* "Search again" affordance after a result */}
            <div
              style={{
                display:        "flex",
                justifyContent: "center",
                marginTop:      "1.5rem",
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                style={{
                  fontFamily:    "var(--font-sans)",
                  fontSize:      "0.6875rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color:         "var(--color-slate)",
                  border:        "1px solid var(--color-divider-dark)",
                  padding:       "0.45rem 1.5rem",
                  backgroundColor: "transparent",
                  cursor:        "pointer",
                  transition:    "color 180ms, border-color 180ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-oxford)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-oxford)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-slate)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-divider-dark)";
                }}
                aria-label="Search for another term"
              >
                Search Another Term · Tafuta Tena
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
