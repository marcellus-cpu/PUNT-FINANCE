/**
 * PUNT FINANCE — Input Validation Schema (Zod)
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-only. The single Zod schema that governs every field entering the
 * translateTerm pipeline. Placed in its own module so it can be imported by:
 *   - app/actions/translateTerm.ts  (the Server Action)
 *   - any future Route Handler that accepts search input
 *   - test suites without importing Next.js internals
 *
 * Relationship to lib/sanitize.ts:
 *   lib/sanitize.ts remains active for the Phase 1 static search action
 *   (app/actions/search.ts). The translateTerm action now uses this Zod
 *   schema as its single validation layer — Zod's transforms handle
 *   normalisation, and its refinements replace the manual ALLOWLIST_PATTERN
 *   and PROMPT_INJECTION_PATTERN checks, with typed, composable error paths.
 *
 * Security contract:
 *   1. Max 50 chars — prevents oversized inputs reaching the DB or AI.
 *   2. Character allowlist — blocks HTML tags, SQL injection, shell metacharacters,
 *      RTL override codepoints, zero-width joiners, and null bytes.
 *   3. Prompt-injection surface scan — rejects the most common English-language
 *      injection openers as an early-stage defence. The structural prompt defence
 *      in lib/ai/anthropic.ts remains the primary barrier.
 *   4. Transform pipeline — whitespace collapse and lowercase normalisation are
 *      co-located with validation so they're guaranteed to run before any
 *      consumer sees the value.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "server-only";
import { z } from "zod";

/* ── Constants ──────────────────────────────────────────────────────────── */

/** Phase 4 hard cap — stricter than Phase 2's 120 chars per brief spec */
export const TERM_MAX_LENGTH = 50;
export const TERM_MIN_LENGTH = 2;

/**
 * Character allowlist — strictly alphanumeric plus financial punctuation.
 *
 * Permitted:
 *   \w    alphanumeric + underscore (tickers: S&P_500, BTC_USD)
 *   \s    spaces (multi-word terms)
 *   \-    hyphens (Mark-to-Market)
 *   \.    periods (U.S. Treasury)
 *   ,     commas
 *   &     ampersand (M&A)
 *   '     apostrophe (Shareholder's Equity)
 *   ()    parentheses (P/E (Price-to-Earnings))
 *   /%+   slash / percent / plus
 *
 * Explicitly BLOCKED (not in \w ASCII range):
 *   < > " ; ` ~ { } [ ] ^ $ | \ @ # ! ? = \n \r
 *   All Unicode outside BMP (emoji, extended scripts, homoglyph attacks)
 */
const ALLOWLIST_RE = /^[\w\s\-.,&'()/%+]{1,50}$/;

/**
 * Prompt-injection surface scan.
 * Catches the most common English-language injection openers before they
 * reach the AI layer. Not exhaustive — the structural XML delimiter in
 * lib/ai/anthropic.ts is the primary defence.
 */
const INJECTION_RE =
  /ignore\s+(previous|above|all|prior)|forget\s+(everything|instructions?)|new\s+instruction|you\s+are\s+now|act\s+as|jailbreak|disregard|system\s+prompt|<\s*script|javascript:/i;

/* ── Zod Schema ─────────────────────────────────────────────────────────── */

/**
 * termSearchSchema
 *
 * The canonical validation + transformation pipeline for a financial search term.
 *
 * Transforms applied (in order, before refinements):
 *   1. Trim leading/trailing whitespace
 *   2. Collapse internal runs of whitespace to a single space
 *
 * Refinements applied (after transforms, so they see the clean value):
 *   1. Min length check
 *   2. Max length check (belt-and-suspenders alongside .max())
 *   3. Character allowlist
 *   4. Prompt-injection scan
 */
export const termSearchSchema = z
  .string({
    required_error:  "A search term is required.",
    invalid_type_error: "Search term must be a text string.",
  })
  .transform((val) =>
    val
      .trim()
      .replace(/\s+/g, " ") // Collapse internal whitespace
  )
  .pipe(
    z
      .string()
      .min(TERM_MIN_LENGTH, {
        message: "Please enter at least 2 characters to begin your inquiry.",
      })
      .max(TERM_MAX_LENGTH, {
        message: `Financial terms are capped at ${TERM_MAX_LENGTH} characters. Please refine your search.`,
      })
      .refine((val) => ALLOWLIST_RE.test(val), {
        message:
          "Your inquiry contains characters we are unable to process. " +
          "Please use standard financial terminology.",
      })
      .refine((val) => !INJECTION_RE.test(val), {
        message:
          "Your inquiry contains patterns the ledger cannot process. " +
          "Please enter a recognised financial term.",
      })
      .transform((val) => val) // Identity — keeps TypeScript output type as string
  );

/* ── Normalisation helper ────────────────────────────────────────────────── */

/**
 * normaliseTerm
 *
 * Produces the canonical DB cache key from an already-validated term.
 * Guaranteed to be called AFTER the schema transform has collapsed whitespace.
 *
 * @param validated - Output of termSearchSchema.parse()
 */
export function normaliseTerm(validated: string): string {
  return validated.toLowerCase();
}

/* ── Typed result wrapper ────────────────────────────────────────────────── */

export type ValidationSuccess = { ok: true;  value: string; normalised: string };
export type ValidationFailure = { ok: false; message: string };
export type ValidationResult  = ValidationSuccess | ValidationFailure;

/**
 * validateSearchTerm
 *
 * Safe wrapper around termSearchSchema.safeParse(). Returns a discriminated
 * union so callers use a single import and never interact with Zod's
 * ZodError type directly — keeping the Zod dependency encapsulated here.
 *
 * @param raw - The raw FormData value (unknown type — could be File, null, etc.)
 */
export function validateSearchTerm(raw: unknown): ValidationResult {
  // FormData.get() can return File | string | null — reject non-strings first
  if (typeof raw !== "string") {
    return {
      ok:      false,
      message: "A search term is required.",
    };
  }

  const result = termSearchSchema.safeParse(raw);

  if (!result.success) {
    // Surface the first error message — never expose Zod internals
    const firstMessage = result.error.errors[0]?.message
      ?? "Your search term could not be validated. Please try again.";
    return { ok: false, message: firstMessage };
  }

  const value = result.data;
  return {
    ok:         true,
    value,
    normalised: normaliseTerm(value),
  };
}
