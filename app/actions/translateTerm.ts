/**
 * PUNT FINANCE — translateTerm Server Action (Phase 4 — hardened)
 * ─────────────────────────────────────────────────────────────────────────────
 * Central orchestration layer. Called by HeroSearch via useActionState.
 *
 * Phase 4 changes vs Phase 2:
 *   • Zod schema (lib/validation.ts) replaces the manual sanitiseTerm() call
 *   • Three-tier rate limiting: burstLimiter (new) → searchLimiter → aiLimiter
 *   • Old Money copy for all rate-limit messages via rateLimitMessage()
 *   • Stricter 50-char input cap (down from 120)
 *   • Idempotent error helper produces richer Retry-After metadata
 *
 * Execution pipeline:
 *   1. IP extraction + hashing      (SHA-256, never stored raw)
 *   2. Burst rate limit             (5 req / 10 s  — DDoS guard)
 *   3. Sustained rate limit         (10 req / 60 s — session guard)
 *   4. Zod input validation         (type + length + allowlist + injection scan)
 *   5. DB cache lookup              (getCachedTerm)
 *   6. AI rate limit                (3 req / 60 s  — billing guard, cache miss only)
 *   7. AI generation                (generateTermExplanation)
 *   8. DB cache save                (saveTerm — race-safe via ON CONFLICT DO NOTHING)
 *   9. Audit log write              (fire-and-forget)
 *  10. Return TranslateState        (serialisable — crosses RSC boundary safely)
 *
 * Security guarantees:
 *   • "use server"  — never bundled into the client
 *   • No API keys, DB credentials, or internal errors reach the client
 *   • IP is SHA-256 hashed before any storage or Redis keying
 *   • Zod schema is the sole gate between FormData and downstream I/O
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use server";

import { headers }                from "next/headers";
import { validateSearchTerm }     from "@/lib/validation";
import { getCachedTerm, saveTerm, writeAuditLog } from "@/lib/db/client";
import {
  checkBurstLimit,
  checkSearchLimit,
  checkAILimit,
  hashIP,
  rateLimitMessage,
}                                 from "@/lib/ratelimit";
import { generateTermExplanation, AIGenerationError } from "@/lib/ai/anthropic";
import type { TranslateState, TranslationResult }     from "@/types/financial";

/* ── Helpers ────────────────────────────────────────────────────────────── */

/**
 * errorState
 * Builds a consistent, serialisable TranslateState for all failure paths.
 * Never exposes stack traces, DB errors, or internal identifiers.
 */
function errorState(
  error: string,
  status: TranslateState["status"] = "error",
  retryAfterMs?: number
): TranslateState {
  return {
    status,
    error,
    ...(retryAfterMs !== undefined && retryAfterMs > 0 ? { retryAfterMs } : {}),
  };
}

/**
 * getClientIP
 *
 * Extracts client IP from request headers in strict priority order:
 *   1. x-real-ip        — set by Vercel edge / Nginx; single authoritative value
 *   2. x-forwarded-for  — set by reverse proxies; use FIRST token only
 *                         (subsequent tokens may be attacker-controlled)
 *   3. Fallback         — local dev; rate limiter still functions correctly
 */
async function getClientIP(): Promise<string> {
  const hdrs = await headers();

  const realIP = hdrs.get("x-real-ip");
  if (realIP?.trim()) return realIP.trim();

  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "127.0.0.1";
}

/* ── Server Action ──────────────────────────────────────────────────────── */

/**
 * translateTerm
 *
 * useActionState-compatible Server Action.
 * Signature: (prevState: TranslateState, formData: FormData) → Promise<TranslateState>
 */
export async function translateTerm(
  _prevState: TranslateState,
  formData: FormData
): Promise<TranslateState> {

  const startMs = Date.now();

  /* ══ Step 1: IP extraction ══════════════════════════════════════════════ */
  const rawIP  = await getClientIP();
  const ipHash = hashIP(rawIP);

  /* ══ Step 2: Burst rate limit (Tier 1 — Phase 4) ═══════════════════════
     Runs BEFORE any parsing or DB I/O.
     Stops automated scripts cold without spending compute on validation.   */
  const burstResult = await checkBurstLimit(ipHash);
  if (!burstResult.allowed) {
    return errorState(
      rateLimitMessage("burst", burstResult.retryAfterMs),
      "rate_limited",
      burstResult.retryAfterMs
    );
  }

  /* ══ Step 3: Sustained search rate limit (Tier 2) ══════════════════════ */
  const searchResult = await checkSearchLimit(ipHash);
  if (!searchResult.allowed) {
    return errorState(
      rateLimitMessage("search", searchResult.retryAfterMs),
      "rate_limited",
      searchResult.retryAfterMs
    );
  }

  /* ══ Step 4: Zod input validation ══════════════════════════════════════
     Replaces Phase 2's manual sanitiseTerm() call.
     The Zod schema runs:
       - Type guard (rejects File, null, non-string FormData values)
       - Whitespace collapse transform
       - Min/max length
       - Character allowlist  (blocks HTML, SQL, shell vectors)
       - Prompt-injection scan
     The output `value` is a clean, transformed string — never raw input.  */
  const validation = validateSearchTerm(formData.get("q"));
  if (!validation.ok) {
    return errorState(validation.message, "invalid_input");
  }

  const { value: termClean, normalised } = validation;

  /* ══ Step 5: DB cache lookup ════════════════════════════════════════════
     Cache HIT  → return instantly. No AI cost. No AI rate limit consumed.
     Cache MISS → continue to AI pipeline.                                  */
  const cached = await getCachedTerm(normalised);

  if (cached) {
    const result: TranslationResult = {
      term:          cached.term_raw,
      termSwahili:   cached.term_swahili,
      explanationEn: cached.explanation_en,
      explanationSw: cached.explanation_sw,
      category:      cached.category,
      difficulty:    cached.difficulty,
      cached:        true,
      generatedAt:   cached.created_at,
      searchCount:   cached.search_count,
    };

    writeAuditLog(ipHash, normalised, true, Date.now() - startMs);
    return { status: "success", data: result };
  }

  /* ══ Step 6: AI generation rate limit (Tier 3) ══════════════════════════
     Only fires on a cache miss — preserves Anthropic API budget.           */
  const aiLimitResult = await checkAILimit(ipHash);
  if (!aiLimitResult.allowed) {
    return errorState(
      rateLimitMessage("ai", aiLimitResult.retryAfterMs),
      "rate_limited",
      aiLimitResult.retryAfterMs
    );
  }

  /* ══ Step 7: AI generation ══════════════════════════════════════════════
     termClean has passed Zod schema — safe to pass to the AI layer.
     The AI module wraps it in XML delimiters; see lib/ai/anthropic.ts.     */
  let aiResponse;
  try {
    aiResponse = await generateTermExplanation(termClean);
  } catch (err) {
    if (err instanceof AIGenerationError) {
      console.error(`[PuntFinance/Action] AI error (${err.code}):`, err.message);
      return errorState(
        "Our analysis desk encountered a difficulty processing your inquiry. " +
        "Please try again shortly.",
        "error"
      );
    }
    console.error("[PuntFinance/Action] Unexpected error in AI generation:", err);
    return errorState(
      "An unexpected difficulty arose. Please try your inquiry again.",
      "error"
    );
  }

  /* ══ Step 8: Persist to DB cache ════════════════════════════════════════
     Awaited — the next request for this term must find a cache hit.
     Race-safe: ON CONFLICT DO NOTHING in saveTerm().                       */
  const saved = await saveTerm(
    termClean,
    normalised,
    aiResponse,
    "claude-sonnet-4-20250514"
  );
  const generatedAt = saved?.created_at ?? new Date().toISOString();

  /* ══ Step 9: Audit log ══════════════════════════════════════════════════
     Fire-and-forget. Never blocks the response.                            */
  writeAuditLog(ipHash, normalised, false, Date.now() - startMs);

  /* ══ Step 10: Return ════════════════════════════════════════════════════
     Only plain serialisable primitives cross the server→client boundary.   */
  const result: TranslationResult = {
    term:          termClean,
    termSwahili:   aiResponse.term_swahili,
    explanationEn: aiResponse.explanation_en,
    explanationSw: aiResponse.explanation_sw,
    category:      aiResponse.category,
    difficulty:    aiResponse.difficulty,
    cached:        false,
    generatedAt,
    searchCount:   1,
  };

  return { status: "success", data: result };
}
