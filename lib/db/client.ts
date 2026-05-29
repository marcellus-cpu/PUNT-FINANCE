import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { FinancialTerm, AITermResponse, TermCategory, TermDifficulty } from "@/types/financial";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[PuntFinance] Missing required environment variable: ${key}.`);
  }
  return value;
}

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;
  _supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  return _supabase;
}

export async function getCachedTerm(normalised: string): Promise<FinancialTerm | null> {
  const db = getSupabaseClient();

  const { data, error } = await db
    .from("financial_terms")
    .select("*")
    .eq("term_normalised", normalised)
    .maybeSingle();

  if (error) {
    console.error("[PuntFinance/DB] getCachedTerm error:", error.message);
    return null;
  }

  if (data) {
    try {
      await db
        .from("financial_terms")
        .update({ search_count: (data.search_count ?? 0) + 1 })
        .eq("id", data.id);
    } catch (e: unknown) {
      console.warn("[PuntFinance/DB] search_count update:", String(e));
    }
  }

  return data as FinancialTerm | null;
}

export async function saveTerm(
  termRaw: string,
  normalised: string,
  aiResponse: AITermResponse,
  modelUsed: string
): Promise<FinancialTerm | null> {
  const db = getSupabaseClient();

  const record = {
    term_raw: termRaw,
    term_normalised: normalised,
    term_swahili: aiResponse.term_swahili,
    explanation_en: aiResponse.explanation_en,
    explanation_sw: aiResponse.explanation_sw,
    category: aiResponse.category as TermCategory,
    difficulty: aiResponse.difficulty as TermDifficulty,
    source: "ai_generated" as const,
    model_used: modelUsed,
    search_count: 1,
  };

  const { data, error } = await db
    .from("financial_terms")
    .upsert(record, {
      onConflict: "term_normalised",
      ignoreDuplicates: true,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("[PuntFinance/DB] saveTerm error:", error.message);
    return null;
  }

  return data as FinancialTerm | null;
}

export async function writeAuditLog(
  ipHash: string,
  normalised: string,
  cacheHit: boolean,
  responseMs: number
): Promise<void> {
  const db = getSupabaseClient();

  try {
    await db
      .from("search_audit_log")
      .insert({
        ip_hash: ipHash,
        term_normalised: normalised,
        cache_hit: cacheHit,
        response_ms: responseMs,
      });
  } catch (e: unknown) {
    console.warn("[PuntFinance/DB] auditLog write:", String(e));
  }
}
