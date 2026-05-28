/**
 * PUNT FINANCE — Input Sanitisation Library
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-only. Never import in 'use client' components.
 *
 * Two distinct sanitisation passes are applied:
 *   1. `sanitiseForDB`   — strips characters dangerous in SQL / NoSQL contexts
 *   2. `sanitiseForAI`   — additionally neutralises prompt-injection vectors
 *
 * The output of sanitiseForAI is used ONLY as delimited data inside the AI
 * prompt, never as free-form instructions. This provides defence-in-depth
 * even if a crafted payload slips through the regex layer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ── Constants ──────────────────────────────────────────────────────────── */

/** Hard cap on input length. Alpha Vantage symbol max is 12; realistic financial
 *  terms rarely exceed 80 characters. 120 gives comfortable headroom.         */
export const MAX_TERM_LENGTH = 120;
export const MIN_TERM_LENGTH = 2;

/**
 * Allowlist pattern — financial terminology character set.
 *
 * Permits:
 *   \w          → alphanumeric + underscore (covers tickers like S&P_500)
 *   \s          → spaces (multi-word terms)
 *   \-          → hyphens (e.g. "Mark-to-Market")
 *   \.          → periods (e.g. "U.S. Treasury")
 *   ,           → commas (e.g. "Stocks, Bonds")
 *   &           → ampersand (e.g. "M&A")
 *   '           → apostrophe (e.g. "Shareholder's Equity")
 *   ()          → parentheses (e.g. "P/E (Price-to-Earnings)")
 *   %           → percent (e.g. "10% Coupon Rate")
 *   +/          → division (e.g. "EPS+Growth / P/E")
 *
 * Explicitly REJECTS:
 *   < > "       → HTML/XSS vectors
 *   ; ` ~       → SQL / shell injection vectors
 *   \n \r \t    → Control characters (whitespace collapse handles real spaces)
 *   { } [ ]     → JSON/template injection
 *   ^ $ | \     → Regex metacharacters — no regex in term names
 *   @ # ! ? =   → Not used in standard financial terminology
 *   Cyrillic / Arabic / CJK homoglyphs — blocked by \w on ASCII input
 */
const ALLOWLIST_PATTERN = /^[\w\s\-.,&'()%+/]{1,120}$/;

/**
 * Additional pattern matching classic prompt-injection phrases.
 * These are checked AFTER character filtering — belt-and-suspenders.
 *
 * Covers the most common English-language injection openers.
 * Not exhaustive — the delimited prompt structure is the primary defence.
 */
const PROMPT_INJECTION_PATTERN =
  /ignore\s+(previous|above|all|prior)|forget\s+(everything|instructions?)|new\s+instruction|you\s+are\s+now|act\s+as|jailbreak|disregard|system\s+prompt/i;

/* ── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Collapse runs of whitespace to a single space and strip edge whitespace.
 * Prevents padding attacks (e.g. hundreds of spaces to overflow logs).
 */
function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

/**
 * normaliseTermKey
 *
 * Produces the canonical cache key for a term — used as the lookup value
 * in `financial_terms.term_normalised`.
 *
 * Rules: lowercase → trim → collapse internal whitespace.
 * This ensures "Short Selling", "short selling", "SHORT  SELLING"
 * all resolve to the same DB row.
 *
 * @param input - Already sanitised term string
 */
export function normaliseTermKey(input: string): string {
  return collapseWhitespace(input).toLowerCase();
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export type SanitiseResult =
  | { ok: true;  value: string; normalised: string }
  | { ok: false; reason: "too_short" | "too_long" | "invalid_chars" | "prompt_injection" };

/**
 * sanitiseTerm
 *
 * Master sanitisation function. Runs both passes and returns a discriminated
 * union so the caller can surface a precise, user-friendly error message.
 *
 * Usage in the Server Action:
 * ```ts
 * const result = sanitiseTerm(formData.get("q"));
 * if (!result.ok) return errorState(result.reason);
 * const { value, normalised } = result;
 * ```
 */
export function sanitiseTerm(raw: unknown): SanitiseResult {
  // ── Step 0: Type guard ───────────────────────────────────────────────
  if (typeof raw !== "string") {
    return { ok: false, reason: "invalid_chars" };
  }

  // ── Step 1: Collapse whitespace ──────────────────────────────────────
  const collapsed = collapseWhitespace(raw);

  // ── Step 2: Length bounds ────────────────────────────────────────────
  if (collapsed.length < MIN_TERM_LENGTH) {
    return { ok: false, reason: "too_short" };
  }
  if (collapsed.length > MAX_TERM_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  // ── Step 3: Character allowlist ──────────────────────────────────────
  if (!ALLOWLIST_PATTERN.test(collapsed)) {
    return { ok: false, reason: "invalid_chars" };
  }

  // ── Step 4: Prompt-injection surface scan ────────────────────────────
  // This catches naive injection attempts before they reach the AI layer.
  // The primary defence remains the delimited prompt structure in anthropic.ts.
  if (PROMPT_INJECTION_PATTERN.test(collapsed)) {
    return { ok: false, reason: "prompt_injection" };
  }

  return {
    ok: true,
    value: collapsed,
    normalised: normaliseTermKey(collapsed),
  };
}

/**
 * sanitiseErrorMessages
 *
 * Maps internal sanitisation error codes to user-facing copy.
 * Never expose internal error names to the client.
 */
export function sanitiseErrorToMessage(
  reason: "too_short" | "too_long" | "invalid_chars" | "prompt_injection"
): string {
  const map: Record<typeof reason, string> = {
    too_short:        "Please enter at least 2 characters.",
    too_long:         "Please shorten your search to 120 characters or fewer.",
    invalid_chars:    "Your query contains characters we cannot process. Please use standard financial terminology.",
    prompt_injection: "Your query contains patterns we cannot process. Please enter a standard financial term.",
  };
  return map[reason];
}
