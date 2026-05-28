-- ═══════════════════════════════════════════════════════════════════════════
-- PUNT FINANCE — Database Schema
-- Engine   : PostgreSQL 15+ (Supabase)
-- Managed  : Apply via Supabase SQL Editor or a migration tool (e.g. Flyway)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram fuzzy search (Phase 3)
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- Accent-insensitive matching


-- ── Enums ─────────────────────────────────────────────────────────────────

CREATE TYPE term_difficulty AS ENUM ('Mwanzo', 'Kati', 'Mtaalam');

CREATE TYPE term_category AS ENUM (
  'Equities',
  'Fixed Income',
  'Derivatives',
  'Macro',
  'Corporate Finance',
  'Forex',
  'Commodities',
  'Crypto',
  'Funds',
  'General'
);

CREATE TYPE term_source AS ENUM ('ai_generated', 'editorial');


-- ── Core Table: financial_terms ───────────────────────────────────────────
--
-- This table IS the caching layer.
-- Lookup path (server action):
--   1. SELECT WHERE term_normalised = normalise($input)  → cache HIT → return row
--   2. Cache MISS → call Anthropic API → INSERT row      → return new row
--   3. Every hit increments search_count (advisory, non-blocking)
--
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_terms (
  -- Identity
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- The term itself
  term_raw          TEXT          NOT NULL,
  -- Normalised key: lowercase + trim + collapse whitespace.
  -- This is the column used for cache lookups — must be unique.
  term_normalised   TEXT          NOT NULL,
  term_swahili      TEXT          NOT NULL,

  -- Explanations
  explanation_en    TEXT          NOT NULL
                    CONSTRAINT explanation_en_min CHECK (char_length(explanation_en) >= 20),
  explanation_sw    TEXT          NOT NULL
                    CONSTRAINT explanation_sw_min CHECK (char_length(explanation_sw) >= 20),

  -- Classification
  category          term_category NOT NULL DEFAULT 'General',
  difficulty        term_difficulty NOT NULL DEFAULT 'Kati',

  -- Provenance
  source            term_source   NOT NULL DEFAULT 'ai_generated',
  model_used        TEXT,           -- e.g. 'claude-sonnet-4-20250514'

  -- Analytics (non-blocking; updated with UPDATE ... SET search_count = search_count + 1)
  search_count      INTEGER       NOT NULL DEFAULT 1
                    CONSTRAINT search_count_positive CHECK (search_count >= 0),

  -- Timestamps (UTC, auto-managed)
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ── Constraints ───────────────────────────────────────────────────────────

-- Uniqueness lives on term_normalised — this is the cache key.
ALTER TABLE financial_terms
  ADD CONSTRAINT uq_financial_terms_normalised UNIQUE (term_normalised);


-- ── Indexes ───────────────────────────────────────────────────────────────

-- Primary lookup index (exact match on normalised term — the hot path).
CREATE INDEX IF NOT EXISTS idx_financial_terms_normalised
  ON financial_terms (term_normalised);

-- Category filter index (Library / browse views in Phase 3).
CREATE INDEX IF NOT EXISTS idx_financial_terms_category
  ON financial_terms (category);

-- Full-text search index for the Swahili explanations (Phase 3 search).
CREATE INDEX IF NOT EXISTS idx_financial_terms_fts_sw
  ON financial_terms
  USING gin(to_tsvector('english', term_swahili || ' ' || explanation_sw));

-- Trigram index for fuzzy "did you mean?" matching (Phase 3).
CREATE INDEX IF NOT EXISTS idx_financial_terms_trgm
  ON financial_terms
  USING gin(term_normalised gin_trgm_ops);

-- Most-searched terms dashboard query.
CREATE INDEX IF NOT EXISTS idx_financial_terms_search_count
  ON financial_terms (search_count DESC);


-- ── Auto-update `updated_at` via trigger ─────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_financial_terms_updated_at
  BEFORE UPDATE ON financial_terms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── Row-Level Security (Supabase) ─────────────────────────────────────────
--
-- Rules:
--   • Anon (public web visitors) → SELECT only.
--   • Service-role (our server-side API key) → all operations.
--   • No user-facing INSERT/UPDATE/DELETE permitted.
--
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE financial_terms ENABLE ROW LEVEL SECURITY;

-- Public: read any cached term (powers the result card).
CREATE POLICY "public_select_terms"
  ON financial_terms FOR SELECT
  TO anon
  USING (true);

-- Service role: full access for the server action (INSERT new terms, UPDATE counters).
CREATE POLICY "service_role_all"
  ON financial_terms FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── Search-Term Audit Log (rate-limit forensics, not used in hot path) ────
--
-- Populated asynchronously — never blocks the main request.
-- Allows billing anomaly detection and abuse pattern analysis.
--
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_audit_log (
  id              BIGSERIAL     PRIMARY KEY,
  ip_hash         TEXT          NOT NULL,   -- SHA-256 of client IP; never raw IP
  term_normalised TEXT          NOT NULL,
  cache_hit       BOOLEAN       NOT NULL,
  response_ms     INTEGER,                  -- Server-side latency in ms
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_ip_hash_time
  ON search_audit_log (ip_hash, created_at DESC);

ALTER TABLE search_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is write-only from service role; no public reads.
CREATE POLICY "service_role_audit"
  ON search_audit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── Seed Data — pre-load 3 editorial terms (no AI cost) ──────────────────

INSERT INTO financial_terms (
  term_raw, term_normalised, term_swahili,
  explanation_en, explanation_sw,
  category, difficulty, source, model_used, search_count
) VALUES
(
  'Inflation',
  'inflation',
  'Mfumuko wa Bei',
  'Inflation is the rate at which the general level of prices for goods and services rises over time, eroding purchasing power. Central banks manage inflation through interest rate policy.',
  'Mfumuko wa bei ni kasi ambayo bei ya bidhaa na huduma inavyoongezeka kwa muda. Unapoongezeka, shilingi yako inaweza kununua kidogo zaidi. Benki kuu hudhibiti hali hii kwa kubadilisha viwango vya riba.',
  'Macro',
  'Mwanzo',
  'editorial',
  NULL,
  0
),
(
  'Short Selling',
  'short selling',
  'Uuzaji wa Mkopo wa Hisa',
  'Short selling is an investment strategy where an investor borrows shares of a stock and sells them, expecting the price to fall. The investor then repurchases the shares at a lower price, returns them, and pockets the difference as profit.',
  'Uuzaji wa mkopo wa hisa ni mkakati ambapo mwekezaji anakopa hisa, anauza sasa hivi, kisha anatarajia bei kushuka. Baadaye, ananunua hisa hizo kwa bei ya chini, anazirudisha, na kupata faida kutokana na tofauti ya bei.',
  'Equities',
  'Kati',
  'editorial',
  NULL,
  0
),
(
  'Quantitative Easing',
  'quantitative easing',
  'Upanuzi wa Kiasi cha Fedha',
  'Quantitative easing (QE) is a monetary policy tool where a central bank purchases government bonds or other financial assets to inject liquidity directly into the financial system, stimulating economic activity when interest rates are already near zero.',
  'Upanuzi wa kiasi cha fedha ni zana ya sera ya fedha ambapo benki kuu inaweza kununua dhamana za serikali ili kuongeza mzunguko wa pesa katika mfumo wa fedha. Hutumika wakati viwango vya riba vipo karibu na sufuri na uchumi unahitaji msukumo wa ziada.',
  'Macro',
  'Mtaalam',
  'editorial',
  NULL,
  0
)
ON CONFLICT (term_normalised) DO NOTHING;
