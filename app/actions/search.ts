/**
 * PUNT FINANCE — Search Server Action
 * ─────────────────────────────────────────────────────────────────────────────
 * Security contract:
 *  • Runs ONLY on the server; never shipped to the client bundle.
 *  • Input is validated and sanitised before any downstream call.
 *  • No API keys are referenced here — they live in environment variables
 *    accessed exclusively within this server boundary.
 * ─────────────────────────────────────────────────────────────────────────────
 */

"use server";

import { redirect } from "next/navigation";

/* Maximum characters we accept for a search query — prevents oversized input
   being forwarded to downstream APIs or logged naively.                       */
const MAX_QUERY_LENGTH = 160;

/* Allowlist: printable ASCII, common punctuation, and basic extended Latin.
   Rejects SQL-injection payloads, script tags, and RTL override characters. */
const SAFE_QUERY_PATTERN = /^[\w\s\-.,&'()%+/]{1,160}$/;

/**
 * sanitiseQuery
 * Strip leading/trailing whitespace, collapse internal runs of whitespace
 * to a single space, and remove characters outside our allowlist.
 */
function sanitiseQuery(raw: string): string {
  return raw
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .replace(/\s+/g, " ")
    .replace(/[^\w\s\-.,&'()%+/]/g, "");
}

/**
 * searchFinancialTerm — Next.js Server Action
 *
 * Invoked by the <form action={searchFinancialTerm}> on the Hero section.
 * Because this is a Server Action, no client-side JavaScript is required for
 * the form to function; it degrades gracefully to a standard POST.
 *
 * PHASE 2 INJECTION POINT ─────────────────────────────────────────────────
 * After redirect, the target route /search?q=... will:
 *   1. Call the Alpha Vantage Symbol Search endpoint:
 *        GET https://www.alphavantage.co/query
 *            ?function=SYMBOL_SEARCH
 *            &keywords={query}
 *            &apikey={process.env.ALPHA_VANTAGE_API_KEY}
 *   2. Results cached with Next.js `unstable_cache` (TTL: 300 s).
 *   3. Per-IP rate limiting via Upstash Redis sliding-window (10 req / min).
 *   4. The Claude / GPT-4 translation layer generates the Swahili summary.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function searchFinancialTerm(
  formData: FormData
): Promise<never> {
  const raw = formData.get("q");

  /* Guard: field must be a non-empty string */
  if (typeof raw !== "string" || raw.trim().length === 0) {
    redirect("/?error=empty_query");
  }

  const clean = sanitiseQuery(raw);

  /* Guard: reject if sanitisation wiped everything meaningful */
  if (clean.length < 2) {
    redirect("/?error=invalid_query");
  }

  /* Guard: pattern allowlist check */
  if (!SAFE_QUERY_PATTERN.test(clean)) {
    redirect("/?error=invalid_query");
  }

  /*
   * Server-side redirect to the search results page.
   * The query is URL-encoded here; the /search route will re-validate
   * the param on the server before making any API call (defence in depth).
   */
  redirect(`/search?q=${encodeURIComponent(clean)}`);
}
