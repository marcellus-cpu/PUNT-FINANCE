/**
 * PUNT FINANCE — Supabase Server Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-only module. Marked with the Next.js server-only guard — any
 * accidental import from a 'use client' file will throw a build error.
 *
 * Uses the SERVICE ROLE key which bypasses RLS — appropriate only for
 * server-side trusted operations (Server Actions, Route Handlers).
 * Never pass this client or its key to the browser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "server-only"; // Build-time guard — throws if bundled into client chunk

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { FinancialTerm, AITermResponse, TermCategory, TermDifficulty } from "@/types/financial";

/* ── Environment validation ─────────────────────────────────────────────── */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[PuntFinance] Missing required environment variable: ${key}. ` +
      `Add it to .env.local and Vercel project settings.`
    );
  }
  return value;
}

/** Singleton client — created once per cold start, reused across requests */
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  _supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"), // ← service role; never expose
    {
      auth: {
        persistSession: false,  // Server context — no session needed
        autoRefreshToken: false,
      },
      db: {
        schema: "public",
      },
    }
  );

  return _supabase;
}

/* ── Public DB API ──────────────────────────────────────────────────────── */

/**
 * getCachedTerm
 *
 * Phase 2 cache-check: exact-match lookup on the normalised term key.
 * Also increments search_count as a non-blocking fire-and-forget update
 * (we do NOT await it — it must never slow down the hot path).
 *
 * Returns null on cache MISS (term not yet in DB).
 *
 * @param normalised - Output of normaliseTermKey() from sanitize.ts
 */
export async function getCachedTerm(normalised: string): Promise<FinancialTerm | null> {
  const db = getSupabaseClient();

  const { data, error } = await db
    .from("financial_terms")
    .select("*")
    .eq("term_normalised", normalised)
    .maybeSingle();   // Returns null instead of error when row absent

  if (error) {
    // Log server-side; never surface raw DB errors to the client
    console.error("[PuntFinance/DB] getCachedTerm error:", error.message);
    return null; // Treat DB error as cache miss → fall through to AI
  }

  if (data) {
    // Non-blocking search_count increment — fire and forget
    db.from("financial_terms")
      .update({ search_count: (data.search_count ?? 0) + 1 })
      .eq("id", data.id)
      .then(() => {})
.catch((e: unknown) => console.warn("[PuntFinance/DB] search_count update:", e instanceof Error ? e.message : String(e)));
  }

  return data as FinancialTerm | null;
}

/**
 * saveTerm
 *
 * Persists a freshly AI-generated term to the cache.
 * Uses ON CONFLICT DO NOTHING via Supabase's upsert with ignoreDuplicates,
 * protecting against race conditions where two concurrent requests for the
 * same term both reach a cache miss simultaneously.
 *
 * @param termRaw     - Original sanitised user input
 * @param normalised  - Normalised cache key
 * @param aiResponse  - Validated AI response object
 * @param modelUsed   - Model string for provenance tracking
 */
export async function saveTerm(
  termRaw: string,
  normalised: string,
  aiResponse: AITermResponse,
  modelUsed: string
): Promise<FinancialTerm | null> {
  const db = getSupabaseClient();

  const record = {
    term_raw:         termRaw,
    term_normalised:  normalised,
    term_swahili:     aiResponse.term_swahili,
    explanation_en:   aiResponse.explanation_en,
    explanation_sw:   aiResponse.explanation_sw,
    category:         aiResponse.category as TermCategory,
    difficulty:       aiResponse.difficulty as TermDifficulty,
    source:           "ai_generated" as const,
    model_used:       modelUsed,
    search_count:     1,
  };

  const { data, error } = await db
    .from("financial_terms")
    .upsert(record, {
      onConflict: "term_normalised",
      ignoreDuplicates: true,   // Race-condition safety — don't overwrite editorial entries
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[PuntFinance/DB] saveTerm error:", error.message);
    // Return null — the caller will still return the AI result to the user,
    // the term just won't be cached this request.
    return null;
  }

  return data as FinancialTerm | null;
}

/**
 * writeAuditLog
 *
 * Appends an entry to search_audit_log.
 * Always called as fire-and-forget — must never block the response.
 * The IP is hashed (SHA-256) before storage — we never persist raw IPs.
 *
 * @param ipHash       - SHA-256 hex of client IP (computed in the action)
 * @param normalised   - Normalised search term
 * @param cacheHit     - Whether the term was found in the DB
 * @param responseMs   - Total server-side latency in milliseconds
 */
export function writeAuditLog(
  ipHash: string,
  normalised: string,
  cacheHit: boolean,
  responseMs: number
): void {
  const db = getSupabaseClient();

  db.from("search_audit_log")
    .insert({ ip_hash: ipHash, term_normalised: normalised, cache_hit: cacheHit, response_ms: responseMs })
    .then(() => {})
    .catch((e: Error) => console.warn("[PuntFinance/DB] auditLog write:", e.message));
}
