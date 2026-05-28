/**
 * PUNT FINANCE — Alpha Vantage News Fetcher
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-only. Fetches the top 5 global financial news articles from
 * the Alpha Vantage NEWS_SENTIMENT endpoint.
 *
 * Caching strategy — TWO layers of defence:
 *
 *   Layer A · Next.js Data Cache (fetch-level)
 *     The native `fetch()` call carries `next: { revalidate: 21600 }`.
 *     Next.js persists this response in its Data Cache on disk/edge.
 *     Subsequent requests within the 6-hour window return from cache
 *     without touching the Alpha Vantage API.
 *
 *   Layer B · unstable_cache (function-level)
 *     The entire `fetchAVNews()` function is wrapped in `unstable_cache`
 *     with a matching TTL. This prevents re-execution of the function's
 *     validation and transformation logic even if the fetch cache misses.
 *
 * Why both?
 *   The fetch cache caches the raw HTTP response body. The unstable_cache
 *   caches the parsed, validated, typed TypeScript object. If Next.js
 *   purges its HTTP cache (e.g. on deploy), the function cache also
 *   resets — they remain in sync. Together they guarantee the AV API
 *   is called at most 4 times per day per deployment region.
 *
 * Security:
 *   ALPHA_VANTAGE_API_KEY is read exclusively here — never interpolated
 *   into a URL that flows to the client, never logged, never returned
 *   in any response object.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "server-only";

import { unstable_cache }                   from "next/cache";
import type { AVResponse, AVFeedItem }      from "@/types/ledger";
import {
  isAVNewsResponse,
  isAVRateLimited,
  isAVApiKeyError,
  isAVError,
}                                           from "@/types/ledger";

/* ── Constants ──────────────────────────────────────────────────────────── */

/** 6 hours in seconds — matches the ISR revalidation period */
const REVALIDATE_SECONDS = 21_600;

/** Number of articles to request from AV — we ask for 5, AI processes all 5 */
const AV_ARTICLE_LIMIT = 5;

/**
 * AV NEWS_SENTIMENT topics filter.
 * Comma-separated list of topics AV understands. Covering broad financial topics
 * to ensure a full feed even on quieter news days.
 */
const AV_TOPICS = "financial_markets,earnings,ipo,mergers_and_acquisitions,economy_macro";

/* ── Typed result shapes ────────────────────────────────────────────────── */

export type AVFetchSuccess = { ok: true;  articles: AVFeedItem[] };
export type AVFetchFailure = { ok: false; reason: string; retryAfterMs: number };
export type AVFetchResult  = AVFetchSuccess | AVFetchFailure;

/* ── Inner fetch function (not exported — wrapped below) ────────────────── */

async function _fetchAVNews(): Promise<AVFetchResult> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    /* No key configured — fail fast in dev; treated as fallback in prod */
    return {
      ok:           false,
      reason:       "ALPHA_VANTAGE_API_KEY is not configured.",
      retryAfterMs: 0,
    };
  }

  /**
   * Construct the URL manually — never use URLSearchParams with a secret key
   * and then log the full URL. The key is in the path here which is acceptable
   * because this runs server-side only and is never serialised to the client.
   *
   * In production, consider routing through a Next.js Route Handler that
   * appends the key on the server side if you want complete URL obfuscation
   * from Next.js tracing / OpenTelemetry.
   */
  const url = [
    "https://www.alphavantage.co/query",
    `?function=NEWS_SENTIMENT`,
    `&topics=${encodeURIComponent(AV_TOPICS)}`,
    `&sort=LATEST`,
    `&limit=${AV_ARTICLE_LIMIT}`,
    `&apikey=${apiKey}`,
  ].join("");

  let raw: Response;

  try {
    raw = await fetch(url, {
      method: "GET",
      headers: {
        "Accept":      "application/json",
        "User-Agent":  "PuntFinance/3.0 (+https://puntfinance.com)",
      },
      /**
       * ══ ISR CACHE DIRECTIVE ═══════════════════════════════════════════
       * This single option is the heart of the Phase 3 caching strategy.
       *
       * next.revalidate: 21600
       *   → Cache this response for 6 hours (21,600 seconds).
       *   → After 6 hours, Next.js serves the stale cached version while
       *     simultaneously re-fetching in the background (stale-while-
       *     revalidate semantics).
       *   → The Alpha Vantage API is called at most 4 times per day.
       *
       * next.tags: ["daily-ledger"]
       *   → Allows on-demand revalidation:
       *       import { revalidateTag } from "next/cache";
       *       revalidateTag("daily-ledger");
       *   → Call this from an admin webhook, a Vercel cron job, or a
       *     CMS publish event to force a fresh fetch ahead of schedule.
       * ══════════════════════════════════════════════════════════════════
       */
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags:       ["daily-ledger"],
      },
    });
  } catch (networkErr) {
    const message = networkErr instanceof Error ? networkErr.message : "Network error";
    console.error("[PuntFinance/AV] Network fetch failed:", message);
    return {
      ok:           false,
      reason:       "Network error reaching Alpha Vantage.",
      retryAfterMs: 5 * 60 * 1000, // 5 min — standard retry on network failure
    };
  }

  /* ── HTTP-level error ────────────────────────────────────────────────── */
  if (!raw.ok) {
    console.error(`[PuntFinance/AV] HTTP ${raw.status} from Alpha Vantage`);
    return {
      ok:           false,
      reason:       `Alpha Vantage returned HTTP ${raw.status}.`,
      retryAfterMs: raw.status === 429 ? 60 * 60 * 1000 : 5 * 60 * 1000,
    };
  }

  /* ── Parse JSON ──────────────────────────────────────────────────────── */
  let body: AVResponse;
  try {
    body = (await raw.json()) as AVResponse;
  } catch {
    console.error("[PuntFinance/AV] Failed to parse response as JSON");
    return {
      ok:           false,
      reason:       "Received malformed data from news provider.",
      retryAfterMs: 5 * 60 * 1000,
    };
  }

  /* ── AV application-level error discrimination ───────────────────────
     AV always returns HTTP 200. Errors are signalled in the JSON body.   */

  if (isAVRateLimited(body)) {
    console.warn("[PuntFinance/AV] Rate limit hit:", body.Note.slice(0, 80));
    return {
      ok:           false,
      reason:       "News provider rate limit reached.",
      retryAfterMs: 60 * 1000, // AV free tier resets every 1 minute
    };
  }

  if (isAVApiKeyError(body)) {
    console.warn("[PuntFinance/AV] API key info:", body.Information.slice(0, 80));
    return {
      ok:           false,
      reason:       "News provider API key issue.",
      retryAfterMs: 0,
    };
  }

  if (isAVError(body)) {
    console.error("[PuntFinance/AV] Error response:", body["Error Message"].slice(0, 80));
    return {
      ok:           false,
      reason:       "News provider returned an error.",
      retryAfterMs: 5 * 60 * 1000,
    };
  }

  /* ── Validate feed ───────────────────────────────────────────────────── */
  if (!isAVNewsResponse(body)) {
    console.error("[PuntFinance/AV] Unexpected response shape:", JSON.stringify(body).slice(0, 200));
    return {
      ok:           false,
      reason:       "Unexpected data shape from news provider.",
      retryAfterMs: 5 * 60 * 1000,
    };
  }

  if (!body.feed || body.feed.length === 0) {
    console.warn("[PuntFinance/AV] Empty feed returned.");
    return {
      ok:           false,
      reason:       "No articles in feed.",
      retryAfterMs: 30 * 60 * 1000, // 30 min — likely off-hours
    };
  }

  /* Trim to requested limit in case AV returns more */
  const articles = body.feed.slice(0, AV_ARTICLE_LIMIT);

  return { ok: true, articles };
}

/* ── Public API: unstable_cache wrapper ─────────────────────────────────── */

/**
 * fetchAVNews
 *
 * The public export. Wraps `_fetchAVNews` in `unstable_cache` so the
 * parsed, typed result is cached at the function level — independent of
 * whether Next.js's Data Cache re-executes the fetch.
 *
 * Cache key: ["av-news"] — a short, collision-free string.
 * TTL: 21,600 s — identical to the fetch-level revalidate.
 * Tags: ["daily-ledger"] — matches fetch tags for unified on-demand purge.
 */
export const fetchAVNews = unstable_cache(
  _fetchAVNews,
  ["av-news"],
  {
    revalidate: REVALIDATE_SECONDS,
    tags:       ["daily-ledger"],
  }
);
