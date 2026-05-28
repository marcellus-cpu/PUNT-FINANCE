/**
 * PUNT FINANCE — Daily Ledger Type Definitions (Phase 3)
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers three distinct data layers in the pipeline:
 *
 *   Layer 1 · AlphaVantage*   Raw shapes from the AV NEWS_SENTIMENT endpoint.
 *                              Validated before any field is trusted.
 *
 *   Layer 2 · LedgerAISummary Structured output contract with the AI model.
 *                              Validated with a runtime type guard.
 *
 *   Layer 3 · LedgerArticle   The merged, enriched article passed to the RSC.
 *                              The only shape the UI layer ever sees.
 *
 *   Layer 4 · LedgerResult    Discriminated union returned by fetchDailyLedger.
 *                              Forces callers to handle both success and error.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/* ════════════════════════════════════════════════════════════════════════════
   LAYER 1 — Alpha Vantage Raw Response Types
   Source: https://www.alphavantage.co/documentation/#news-sentiment
   ════════════════════════════════════════════════════════════════════════════ */

export interface AVTickerSentiment {
  ticker:                   string;
  relevance_score:          string;
  ticker_sentiment_score:   string;
  ticker_sentiment_label:   string;
}

export interface AVTopic {
  topic:            string;
  relevance_score:  string;
}

/** A single article in the Alpha Vantage feed array */
export interface AVFeedItem {
  title:                      string;
  url:                        string;
  time_published:             string;  // Format: "YYYYMMDDTHHmmss"
  authors:                    string[];
  summary:                    string;
  banner_image:               string | null;
  source:                     string;
  category_within_source:     string;
  source_domain:              string;
  topics:                     AVTopic[];
  overall_sentiment_score:    number;
  overall_sentiment_label:    string;  // "Bullish" | "Bearish" | "Neutral" | etc.
  ticker_sentiment:           AVTickerSentiment[];
}

/** Top-level Alpha Vantage NEWS_SENTIMENT response */
export interface AVNewsResponse {
  items:              string;  // "5" — stringified number (AV quirk)
  sentiment_score_definition:   string;
  relevance_score_definition:   string;
  feed:               AVFeedItem[];
}

/**
 * Rate-limit / API error responses from Alpha Vantage.
 * AV returns these as 200 OK with a JSON body — not HTTP 429/500.
 * We must check for these shapes before assuming the response is a valid feed.
 */
export interface AVRateLimitResponse  { Note:        string; }
export interface AVApiKeyResponse     { Information: string; }
export interface AVErrorResponse      { "Error Message": string; }

/** Union of all possible AV top-level responses */
export type AVResponse =
  | AVNewsResponse
  | AVRateLimitResponse
  | AVApiKeyResponse
  | AVErrorResponse;

/* ════════════════════════════════════════════════════════════════════════════
   LAYER 2 — AI Summarisation Contract
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Sentiment direction for the card accent colouring.
 * Maps from AV's overall_sentiment_label to our simplified three-way enum.
 */
export type SentimentDirection = "bullish" | "bearish" | "neutral";

/**
 * The exact JSON object we ask the AI to return for each article.
 * Three Swahili bullet points + a derived ticker symbol + category.
 */
export interface LedgerAISummary {
  /** Three concise Swahili bullet points — no markdown, plain strings */
  bullets_sw: [string, string, string];
  /** Most relevant ticker extracted from context (e.g. "NVDA", "NSE-20") */
  ticker:     string;
  /** Market or exchange name (e.g. "NASDAQ", "Nairobi SE", "US Bonds") */
  market:     string;
  /** Category tag shown on the card badge */
  category:   string;
}

/** Runtime type guard for LedgerAISummary */
export function isLedgerAISummary(obj: unknown): obj is LedgerAISummary {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o.bullets_sw) &&
    o.bullets_sw.length === 3 &&
    o.bullets_sw.every((b: unknown) => typeof b === "string" && b.length > 5) &&
    typeof o.ticker   === "string" && o.ticker.length   > 0 &&
    typeof o.market   === "string" && o.market.length   > 0 &&
    typeof o.category === "string" && o.category.length > 0
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LAYER 3 — Enriched Article (UI-facing shape)
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * The merged article shape that flows from fetchDailyLedger → DailyLedger RSC → cards.
 * Fields are always present — never optional — so card components need no null-checks.
 */
export interface LedgerArticle {
  /** Stable deduplication key — SHA-256 of the article URL, truncated to 16 hex */
  id:               string;

  /* ── From Alpha Vantage ── */
  headline:         string;
  sourceLabel:      string;
  sourceUrl:        string;
  publishedAt:      string;   // ISO 8601 — formatted for display in the card
  publishedDisplay: string;   // Human-readable: "26 May 2026 · 14:30 UTC"
  sentiment:        SentimentDirection;

  /* ── From AI summarisation ── */
  bulletsSw:        [string, string, string];
  ticker:           string;
  market:           string;
  categoryTag:      string;
}

/* ════════════════════════════════════════════════════════════════════════════
   LAYER 4 — Pipeline Result (discriminated union)
   ════════════════════════════════════════════════════════════════════════════ */

export type LedgerResult =
  | {
      ok:           true;
      articles:     LedgerArticle[];
      /** ISO 8601 timestamp of when this data was fetched (from the cache or live) */
      fetchedAt:    string;
      /** true = data came from the static fallback (all APIs down/rate-limited) */
      isFallback:   boolean;
    }
  | {
      ok:           false;
      error:        string;
      /** Milliseconds until retry is reasonable — 0 if unknown */
      retryAfterMs: number;
    };

/* ════════════════════════════════════════════════════════════════════════════
   RUNTIME GUARDS — Alpha Vantage response discrimination
   ════════════════════════════════════════════════════════════════════════════ */

export function isAVNewsResponse(r: AVResponse): r is AVNewsResponse {
  return "feed" in r && Array.isArray((r as AVNewsResponse).feed);
}

export function isAVRateLimited(r: AVResponse): r is AVRateLimitResponse {
  return "Note" in r;
}

export function isAVApiKeyError(r: AVResponse): r is AVApiKeyResponse {
  return "Information" in r;
}

export function isAVError(r: AVResponse): r is AVErrorResponse {
  return "Error Message" in r;
}
