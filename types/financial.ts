/**
 * PUNT FINANCE — Shared Type Definitions
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all domain types shared across:
 *   Server Actions · DB layer · AI layer · Client components
 *
 * Never import from here in 'use client' files unless the type is
 * purely structural (no server-only imports).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ════════════════════════════════════════════════════════════════════════════
   DOMAIN — Financial Term (maps 1:1 to the `financial_terms` DB table)
   ════════════════════════════════════════════════════════════════════════════ */

/** Difficulty level, mirrored from DB enum `term_difficulty` */
export type TermDifficulty = "Mwanzo" | "Kati" | "Mtaalam";

/** High-level category for tagging and filtering */
export type TermCategory =
  | "Equities"
  | "Fixed Income"
  | "Derivatives"
  | "Macro"
  | "Corporate Finance"
  | "Forex"
  | "Commodities"
  | "Crypto"
  | "Funds"
  | "General";

/**
 * The core domain object — a fully-translated financial term entry.
 * Matches the columns returned by `SELECT * FROM financial_terms`.
 */
export interface FinancialTerm {
  id: string;                       // UUID v4
  term_raw: string;                 // Original user input (sanitised)
  term_normalised: string;          // Lowercase, trimmed, de-duped key
  term_swahili: string;             // Swahili translation of the term name
  explanation_en: string;           // Jargon-free English explanation
  explanation_sw: string;           // Full Swahili explanation
  category: TermCategory;
  difficulty: TermDifficulty;
  source: "ai_generated" | "editorial"; // Provenance
  model_used: string | null;        // e.g. "claude-sonnet-4-20250514"
  search_count: number;             // How many times this term has been hit
  created_at: string;               // ISO 8601
  updated_at: string;               // ISO 8601
}

/* ════════════════════════════════════════════════════════════════════════════
   SERVER ACTION — State shapes (serialisable: no class instances)
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * The payload returned inside a successful TranslateState.
 * Deliberately a subset of FinancialTerm — only what the UI needs.
 */
export interface TranslationResult {
  term: string;
  termSwahili: string;
  explanationEn: string;
  explanationSw: string;
  category: TermCategory;
  difficulty: TermDifficulty;
  cached: boolean;           // true = DB hit, false = fresh AI generation
  generatedAt: string;       // ISO 8601 for display ("Added to Ledger: …")
  searchCount: number;
}

/** Status discriminant for the Server Action result */
export type TranslateStatus =
  | "idle"
  | "success"
  | "error"
  | "rate_limited"
  | "invalid_input";

/** Full state shape consumed by useActionState in the client component */
export interface TranslateState {
  status: TranslateStatus;
  data?: TranslationResult;
  error?: string;            // Human-readable error, safe to display
  retryAfterMs?: number;     // Milliseconds until rate limit resets
}

/* ════════════════════════════════════════════════════════════════════════════
   AI LAYER — Structured output contract with the LLM
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * The exact JSON object we instruct the AI to return.
 * Validated with a type guard before trusting.
 */
export interface AITermResponse {
  term_swahili: string;
  explanation_en: string;
  explanation_sw: string;
  category: TermCategory;
  difficulty: TermDifficulty;
}

/** Type guard — validates the raw AI JSON before we touch it */
export function isAITermResponse(obj: unknown): obj is AITermResponse {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;

  const validCategories: TermCategory[] = [
    "Equities", "Fixed Income", "Derivatives", "Macro",
    "Corporate Finance", "Forex", "Commodities", "Crypto", "Funds", "General",
  ];
  const validDifficulties: TermDifficulty[] = ["Mwanzo", "Kati", "Mtaalam"];

  return (
    typeof o.term_swahili   === "string" && o.term_swahili.length   > 0 &&
    typeof o.explanation_en === "string" && o.explanation_en.length > 20 &&
    typeof o.explanation_sw === "string" && o.explanation_sw.length > 20 &&
    validCategories.includes(o.category as TermCategory) &&
    validDifficulties.includes(o.difficulty as TermDifficulty)
  );
}
