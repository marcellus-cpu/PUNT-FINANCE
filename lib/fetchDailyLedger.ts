/**
 * PUNT FINANCE — fetchDailyLedger
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-only pipeline orchestrator for Phase 3.
 *
 * Execution order:
 *   1. fetchAVNews()          → raw Alpha Vantage articles (ISR-cached)
 *   2. summariseArticles()    → AI Swahili bullets (fingerprint-cached)
 *   3. mergeArticles()        → combine AV + AI into LedgerArticle[]
 *   4. [if any step fails]    → return STATIC_FALLBACK articles
 *
 * The static fallback is a hand-curated set of 3 evergreen articles.
 * It ensures The Daily Ledger section is NEVER blank — even during an
 * Alpha Vantage outage, Anthropic downtime, or a cold deploy with no key.
 *
 * Error philosophy:
 *   This function NEVER throws. It always resolves to a LedgerResult.
 *   The calling RSC (DailyLedger.tsx) decides how to present a failure.
 *   The `isFallback: true` flag lets the UI show a subtle "serving cached
 *   editorial content" notice without alarming the user.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "server-only";

import { createHash }             from "crypto";
import { fetchAVNews }            from "@/lib/ledger/alphavantage";
import { summariseArticles }      from "@/lib/ledger/summarise";
import type {
  AVFeedItem,
  LedgerArticle,
  LedgerResult,
  SentimentDirection,
}                                 from "@/types/ledger";

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * parseAVDate
 *
 * Alpha Vantage publishes dates in the format "YYYYMMDDTHHmmss" (e.g. "20260526T143052").
 * We parse this into a valid ISO 8601 string and a human-readable display string.
 */
function parseAVDate(avDate: string): { iso: string; display: string } {
  const safe = avDate.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
    "$1-$2-$3T$4:$5:$6Z"
  );

  let date: Date;
  try {
    date = new Date(safe);
    if (isNaN(date.getTime())) throw new Error("Invalid date");
  } catch {
    date = new Date();
  }

  const display = new Intl.DateTimeFormat("en-GB", {
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: "UTC",
    hour12:   false,
  }).format(date) + " UTC";

  return { iso: date.toISOString(), display };
}

/**
 * mapSentiment
 *
 * Maps AV's verbose sentiment label to our three-way enum used for
 * card accent colouring in the UI.
 */
function mapSentiment(label: string): SentimentDirection {
  const l = label.toLowerCase();
  if (l.includes("bull") || l.includes("positive")) return "bullish";
  if (l.includes("bear") || l.includes("negative")) return "bearish";
  return "neutral";
}

/**
 * articleId
 *
 * Generates a stable 16-char hex ID from the article URL.
 * Used as the React key and for deduplication — never as a secret.
 */
function articleId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

/* ════════════════════════════════════════════════════════════════════════════
   STATIC FALLBACK ARTICLES
   Shown when all external APIs are unavailable.
   These are hand-curated, editorially reviewed, and evergreen.
   They carry `isFallback: true` so the UI can show a subtle notice.
   ════════════════════════════════════════════════════════════════════════════ */

const STATIC_FALLBACK: LedgerArticle[] = [
  {
    id:               "fallback-01",
    headline:         "Global Central Banks Navigate Post-Pandemic Rate Normalisation",
    sourceLabel:      "Punt Finance Editorial",
    sourceUrl:        "https://puntfinance.com/markets",
    publishedAt:      new Date().toISOString(),
    publishedDisplay: "Editorial Content",
    sentiment:        "neutral",
    bulletsSw: [
      "Benki kuu za dunia zinaendelea kupunguza viwango vya riba baada ya kipindi cha mfumuko wa bei.",
      "Mabadiliko haya yanaathiri bei za dhamana za serikali na mikopo ya nyumba katika nchi nyingi.",
      "Wawekezaji wanashauriwa kufuatilia mwenendo wa sera za fedha za FED na ECB.",
    ],
    ticker:      "10Y-UST",
    market:      "Global Bonds",
    categoryTag: "Macro",
  },
  {
    id:               "fallback-02",
    headline:         "Emerging Market Equities Attract Renewed Institutional Interest",
    sourceLabel:      "Punt Finance Editorial",
    sourceUrl:        "https://puntfinance.com/markets",
    publishedAt:      new Date().toISOString(),
    publishedDisplay: "Editorial Content",
    sentiment:        "bullish",
    bulletsSw: [
      "Masoko ya hisa ya nchi zinazokua yanavutia uwekezaji mkubwa kutoka kwa taasisi za fedha za kimataifa.",
      "Nchi za Afrika Mashariki, ikiwemo Kenya na Tanzania, zinaonekana kama mazingira mazuri ya uwekezaji.",
      "Kupanda kwa sarafu za ndani dhidi ya dola kunaongeza faida kwa wawekezaji wa kigeni.",
    ],
    ticker:      "EEM",
    market:      "Emerging Markets",
    categoryTag: "Equities",
  },
  {
    id:               "fallback-03",
    headline:         "Technology Sector Valuations Remain Elevated Amid AI Investment Cycle",
    sourceLabel:      "Punt Finance Editorial",
    sourceUrl:        "https://puntfinance.com/markets",
    publishedAt:      new Date().toISOString(),
    publishedDisplay: "Editorial Content",
    sentiment:        "neutral",
    bulletsSw: [
      "Thamani za hisa za kampuni za teknolojia bado ni juu kutokana na matarajio ya faida za akili bandia.",
      "Kampuni zinazowekeza sana katika AI zinaongeza matumizi ya umeme na miundombinu ya data centres.",
      "Wachambuzi wanaonya kuhusu hatari ya tathmini kubwa kupita kiasi hasa kwa kampuni za hatua za awali.",
    ],
    ticker:      "QQQ",
    market:      "NASDAQ",
    categoryTag: "Equities",
  },
];

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PIPELINE FUNCTION
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * fetchDailyLedger
 *
 * The single public export. Called by the DailyLedger RSC.
 * Returns a LedgerResult discriminated union — always resolves, never throws.
 *
 * The ISR caching is applied at the individual step level (fetchAVNews,
 * summariseArticles) rather than here, giving finer control:
 *   - AV fetch cache: keyed on the AV endpoint + params
 *   - AI summary cache: keyed on article URL fingerprint
 *
 * This means if AV returns the same 5 articles twice in a row, the AI
 * summary cache hits and no Anthropic call is made on the second run.
 */
export async function fetchDailyLedger(): Promise<LedgerResult> {
  const fetchedAt = new Date().toISOString();

  /* ── Step 1: Fetch raw articles from Alpha Vantage ─────────────────── */
  let avArticles: AVFeedItem[];

  const avResult = await fetchAVNews();

  if (!avResult.ok) {
    console.warn("[PuntFinance/Ledger] AV fetch failed:", avResult.reason, "— serving fallback.");
    return {
      ok:         true,
      articles:   STATIC_FALLBACK,
      fetchedAt,
      isFallback: true,
    };
  }

  avArticles = avResult.articles;

  /* ── Step 2: AI summarisation ──────────────────────────────────────── */
  const aiInput = avArticles.map((a) => ({
    title:   a.title,
    summary: a.summary,
    url:     a.url,
  }));

  const aiResult = await summariseArticles(aiInput);

  if (!aiResult.ok) {
    console.warn("[PuntFinance/Ledger] AI summarisation failed:", aiResult.reason, "— serving fallback.");
    return {
      ok:         true,
      articles:   STATIC_FALLBACK,
      fetchedAt,
      isFallback: true,
    };
  }

  /* ── Step 3: Merge AV + AI into LedgerArticle[] ─────────────────────
     Guard: ensure both arrays are same length before zipping.
     In theory they always are (we sent N articles, we get N summaries),
     but a partial AI response could be shorter.                         */
  const minLength = Math.min(avArticles.length, aiResult.summaries.length);

  if (minLength === 0) {
    console.warn("[PuntFinance/Ledger] Zero articles after merge — serving fallback.");
    return {
      ok:         true,
      articles:   STATIC_FALLBACK,
      fetchedAt,
      isFallback: true,
    };
  }

  const articles: LedgerArticle[] = [];

  for (let i = 0; i < minLength; i++) {
    const av  = avArticles[i]!;
    const ai  = aiResult.summaries[i]!;
    const { iso, display } = parseAVDate(av.time_published);

    articles.push({
      id:               articleId(av.url),
      headline:         av.title,
      sourceLabel:      av.source,
      sourceUrl:        av.url,
      publishedAt:      iso,
      publishedDisplay: display,
      sentiment:        mapSentiment(av.overall_sentiment_label),
      bulletsSw:        ai.bullets_sw,
      ticker:           ai.ticker,
      market:           ai.market,
      categoryTag:      ai.category,
    });
  }

  return {
    ok:         true,
    articles,
    fetchedAt,
    isFallback: false,
  };
}
