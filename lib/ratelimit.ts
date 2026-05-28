/**
 * PUNT FINANCE — Rate Limiting (Phase 4 — hardened)
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-only. Three-tier Upstash sliding-window rate limiter.
 *
 * Tier   Limiter          Window    Limit   Covers
 * ─────  ───────────────  ────────  ──────  ──────────────────────────────────
 *   1    burstLimiter     10 s       5 req  DDoS / scripted burst protection
 *   2    searchLimiter    60 s      10 req  Sustained search budget (all terms)
 *   3    aiLimiter        60 s       3 req  AI-generation budget (cache misses)
 *
 * A request must pass ALL applicable tiers in order:
 *   burstLimiter → searchLimiter → [cache miss?] → aiLimiter
 *
 * Why three tiers?
 *   Tier 1 stops automated scripts that fire 100 req/s before any DB or AI
 *   cost is incurred. Tier 2 prevents sustained harvesting of the AI cache
 *   within a normal browsing session. Tier 3 specifically guards Anthropic
 *   API billing — only triggered on a DB miss.
 *
 * Algorithm: Sliding Window throughout.
 *   Fixed windows allow a burst at window boundaries (e.g. 10 req at 00:59
 *   and 10 more at 01:01 = 20 req in 2 s). Sliding window tracks each
 *   request's timestamp and enforces the budget across a rolling period.
 *
 * Environment variables required:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *   IP_HASH_SALT   (random 32-byte hex — rotate on breach)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "server-only";

import { Ratelimit }  from "@upstash/ratelimit";
import { Redis }      from "@upstash/redis";
import { createHash } from "crypto";

/* ── Upstash Redis client (singleton) ──────────────────────────────────── */

function buildRedisClient(): Redis {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "[PuntFinance] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN " +
      "must be set. See .env.example for setup instructions."
    );
  }

  return new Redis({ url, token });
}

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) _redis = buildRedisClient();
  return _redis;
}

/* ── Rate limit instances ───────────────────────────────────────────────── */

/**
 * burstLimiter  (Tier 1 — Phase 4 addition)
 *
 * 5 requests per 10 seconds per IP.
 * The strictest tier — runs FIRST, before any DB or AI call.
 * Stops automated scripts and credential-stuffing tools cold.
 *
 * "Old Money" error message used by the action when this fires:
 *   "The ledger is currently processing high volumes. Please pause a
 *    moment before inquiring again."
 */
export const burstLimiter = new Ratelimit({
  redis:          getRedis(),
  limiter:        Ratelimit.slidingWindow(5, "10 s"),
  prefix:         "pf_burst",
  analytics:      true,
  ephemeralCache: new Map(),
});

/**
 * searchLimiter  (Tier 2)
 *
 * 10 requests per 60 seconds per IP.
 * Sustained-rate guard — runs after burstLimiter on every search.
 */
export const searchLimiter = new Ratelimit({
  redis:          getRedis(),
  limiter:        Ratelimit.slidingWindow(10, "60 s"),
  prefix:         "pf_search",
  analytics:      true,
  ephemeralCache: new Map(),
});

/**
 * aiLimiter  (Tier 3)
 *
 * 3 requests per 60 seconds per IP.
 * AI-generation guard — runs ONLY on a DB cache miss.
 * Protects Anthropic API billing from sustained exploitation.
 */
export const aiLimiter = new Ratelimit({
  redis:          getRedis(),
  limiter:        Ratelimit.slidingWindow(3, "60 s"),
  prefix:         "pf_ai_generate",
  analytics:      true,
  ephemeralCache: new Map(),
});

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface RateLimitResult {
  allowed:      boolean;
  remaining:    number;
  resetAt:      number;   // Unix ms timestamp of window reset
  retryAfterMs: number;   // How long to wait (ms) if blocked; 0 if allowed
}

/* ── Identifier helpers ─────────────────────────────────────────────────── */

/**
 * hashIP
 *
 * SHA-256 + salt → truncated 40-char hex identifier.
 * One-way, collision-resistant, GDPR-proportionate for rate-limit keying.
 * Never stored as raw IP anywhere in the system.
 */
export function hashIP(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT ?? "punt_finance_v1"))
    .digest("hex")
    .slice(0, 40);
}

/* ── Check helpers ──────────────────────────────────────────────────────── */

function toResult(
  success: boolean,
  remaining: number,
  reset: number
): RateLimitResult {
  const now = Date.now();
  return {
    allowed:      success,
    remaining,
    resetAt:      reset,
    retryAfterMs: success ? 0 : Math.max(0, reset - now),
  };
}

/** Tier 1 — burst check (5 / 10 s) */
export async function checkBurstLimit(id: string): Promise<RateLimitResult> {
  const { success, remaining, reset } = await burstLimiter.limit(id);
  return toResult(success, remaining, reset);
}

/** Tier 2 — sustained search check (10 / 60 s) */
export async function checkSearchLimit(id: string): Promise<RateLimitResult> {
  const { success, remaining, reset } = await searchLimiter.limit(id);
  return toResult(success, remaining, reset);
}

/** Tier 3 — AI generation check (3 / 60 s) */
export async function checkAILimit(id: string): Promise<RateLimitResult> {
  const { success, remaining, reset } = await aiLimiter.limit(id);
  return toResult(success, remaining, reset);
}

/* ── Elegant error messages (Old Money tone) ────────────────────────────── */

/**
 * rateLimitMessage
 *
 * Returns a copy-edited, brand-voice-appropriate error string for each tier.
 * The countdown in seconds is always accurate and displayed prominently.
 */
export function rateLimitMessage(
  tier: "burst" | "search" | "ai",
  retryAfterMs: number
): string {
  const seconds = Math.ceil(retryAfterMs / 1000);

  const messages: Record<typeof tier, string> = {
    burst:
      `The ledger is currently processing high volumes. ` +
      `Please pause a moment before inquiring again — ` +
      `the reading room will be available in ${seconds} second${seconds === 1 ? "" : "s"}.`,

    search:
      `You have reached the inquiry limit for this session. ` +
      `Our ledger observes a brief interval between consultations. ` +
      `Please return in ${seconds} second${seconds === 1 ? "" : "s"}.`,

    ai:
      `This term requires original research from our analysis desk. ` +
      `The desk observes a brief interval between new commissions. ` +
      `Please return in ${seconds} second${seconds === 1 ? "" : "s"}.`,
  };

  return messages[tier];
}
