/**
 * PUNT FINANCE — On-Demand Revalidation Route Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/revalidate-ledger
 *
 * Triggers an immediate cache purge of the "daily-ledger" cache tag,
 * forcing the next user request to re-run the full pipeline:
 *   fetchAVNews() → summariseArticles() → DailyLedger RSC re-renders
 *
 * Intended callers:
 *   1. Vercel Cron Job  → hits this endpoint every 6 hours (see vercel.json)
 *   2. Admin webhook    → call manually after a major market event
 *   3. CI/CD pipeline   → trigger after a content deploy
 *
 * Security:
 *   The `Authorization: Bearer <token>` header is required on every request.
 *   The secret is stored in REVALIDATE_SECRET (server-only env var).
 *   Without this check, any internet user could deplete our AV/AI quota.
 *
 * Usage:
 *   curl -X POST https://puntfinance.com/api/revalidate-ledger \
 *     -H "Authorization: Bearer YOUR_REVALIDATE_SECRET"
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // revalidateTag requires Node.js runtime

export async function POST(request: NextRequest): Promise<NextResponse> {
  /* ── 1. Auth check ─────────────────────────────────────────────────── */
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.error("[PuntFinance/Revalidate] REVALIDATE_SECRET not configured.");
    return NextResponse.json(
      { ok: false, error: "Server configuration error." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token      = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token || token !== secret) {
    /* Constant-time comparison would be ideal; Next.js runs in a trusted
       edge/Node context but we keep it simple for readability here.      */
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 }
    );
  }

  /* ── 2. Purge the daily-ledger cache tag ────────────────────────────── */
  try {
    revalidateTag("daily-ledger");
    console.info("[PuntFinance/Revalidate] Cache tag 'daily-ledger' purged at", new Date().toISOString());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[PuntFinance/Revalidate] revalidateTag failed:", message);
    return NextResponse.json(
      { ok: false, error: "Revalidation failed." },
      { status: 500 }
    );
  }

  /* ── 3. Success ─────────────────────────────────────────────────────── */
  return NextResponse.json(
    {
      ok:          true,
      revalidated: ["daily-ledger"],
      timestamp:   new Date().toISOString(),
    },
    { status: 200 }
  );
}

/* Reject all other HTTP methods explicitly */
export function GET():    NextResponse { return NextResponse.json({ ok: false }, { status: 405 }); }
export function PUT():    NextResponse { return NextResponse.json({ ok: false }, { status: 405 }); }
export function DELETE(): NextResponse { return NextResponse.json({ ok: false }, { status: 405 }); }
