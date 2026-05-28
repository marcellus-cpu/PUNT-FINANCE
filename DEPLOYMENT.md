# Punt Finance — Deployment Runbook

**Stack:** Next.js 16.2 · Tailwind CSS v4 · Supabase · Anthropic Claude · Upstash Redis · Alpha Vantage · Vercel

This document takes you from a clean machine to a live, production-hardened deployment in five stages. Complete them in order — each stage provides credentials the next one needs.

---

## Before You Begin — Prerequisites

Install these tools if you do not have them:

```bash
node --version   # Must be ≥ 20.0.0
npm --version    # Must be ≥ 10.0.0
git --version    # Any recent version
```

You will need accounts at five services. All have free tiers that cover this project:

| Service | Purpose | Free tier |
|---|---|---|
| [github.com](https://github.com) | Code host | Unlimited public/private repos |
| [vercel.com](https://vercel.com) | Hosting | Hobby plan — free |
| [supabase.com](https://supabase.com) | PostgreSQL database | 500 MB, 2 projects |
| [console.upstash.com](https://console.upstash.com) | Redis rate limiting | 10,000 requests/day |
| [alphavantage.co](https://www.alphavantage.co/support/#api-key) | Market news feed | 25 requests/day |

You already have an Anthropic account for the API key.

---

## Stage 1 — Local Setup (15 minutes)

### 1.1 Put the code in a folder

Take the files from this delivery and place them in a folder on your computer. The structure should look exactly like this:

```
punt-finance/
  app/
    actions/
    api/
    components/
    error.tsx
    globals.css
    layout.tsx
    not-found.tsx
    page.tsx
  database/
    schema.sql
  lib/
    ai/
    db/
    ledger/
    fetchDailyLedger.ts
    ratelimit.ts
    sanitize.ts
    validation.ts
  public/
    robots.txt
  types/
    financial.ts
    ledger.ts
  middleware.ts
  next.config.ts
  package.json
  tsconfig.json
  vercel.json
  .env.example
  .gitignore
```

### 1.2 Install dependencies

Open a terminal inside the `punt-finance` folder and run:

```bash
npm install
```

This installs all packages from `package.json` including Next.js, Zod, Supabase, Upstash, and Anthropic SDK.

### 1.3 Create your local environment file

```bash
cp .env.example .env.local
```

Leave `.env.local` open in a text editor — you will fill in each value in the stages below.

---

## Stage 2 — Supabase (Database) Setup (10 minutes)

### 2.1 Create a project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Name it `punt-finance`. Choose a region close to your users (e.g. `eu-west-1` for East Africa via London, or `us-east-1`).
4. Set a strong database password and **save it somewhere safe**.
5. Wait ~2 minutes for the project to provision.

### 2.2 Run the schema migration

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `database/schema.sql` from your code folder.
4. Copy the entire contents and paste it into the SQL Editor.
5. Click **Run** (or press `Cmd/Ctrl + Enter`).

You should see a success message. This creates:
- The `financial_terms` table (the AI translation cache)
- The `search_audit_log` table
- All indexes, RLS policies, and the 3 seed entries

### 2.3 Copy your API keys

1. In Supabase, go to **Settings → API**.
2. Copy these three values into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...       # "service_role" key — keep secret
```

---

## Stage 3 — Upstash Redis Setup (5 minutes)

### 3.1 Create a Redis database

1. Go to [console.upstash.com](https://console.upstash.com) and sign in.
2. Click **Create Database**.
3. Name it `punt-finance-ratelimit`.
4. Choose **Regional** and the same region as your Supabase project.
5. Keep **TLS** enabled. Click **Create**.

### 3.2 Copy your credentials

1. On your database page, click the **REST API** tab.
2. Copy these two values into `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://xxxxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxx...
```

---

## Stage 4 — Remaining API Keys (5 minutes)

### 4.1 Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com).
2. Navigate to **API Keys** and click **Create Key**.
3. Name it `punt-finance-production`.
4. Copy the key (it starts with `sk-ant-api03-`) into `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 4.2 Alpha Vantage API key

1. Go to [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key).
2. Fill in the short form with your name and email. The key is delivered instantly.
3. Copy it into `.env.local`:

```bash
ALPHA_VANTAGE_API_KEY=XXXXXXXXXXXXXXXX
```

### 4.3 Generate the two security secrets

Run these two commands in your terminal. Each generates a cryptographically random 32-byte hex string:

```bash
openssl rand -hex 32   # Copy the output → IP_HASH_SALT
openssl rand -hex 32   # Copy the output → REVALIDATE_SECRET
```

Add both to `.env.local`:

```bash
IP_HASH_SALT=a1b2c3d4...     # First output
REVALIDATE_SECRET=e5f6g7h8... # Second output
```

### 4.4 Verify your completed .env.local

Your `.env.local` should now have **8 variables** filled in:

```
NEXT_PUBLIC_SUPABASE_URL       ✓
NEXT_PUBLIC_SUPABASE_ANON_KEY  ✓
SUPABASE_SERVICE_ROLE_KEY      ✓
ANTHROPIC_API_KEY              ✓
UPSTASH_REDIS_REST_URL         ✓
UPSTASH_REDIS_REST_TOKEN       ✓
ALPHA_VANTAGE_API_KEY          ✓
IP_HASH_SALT                   ✓
REVALIDATE_SECRET              ✓
NEXT_PUBLIC_SITE_URL           (set to http://localhost:3000 for now)
```

---

## Stage 5 — Test Locally (5 minutes)

With all environment variables in place, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Checklist — verify these work before deploying:**

- [ ] The homepage loads with the "Old Money" ivory/oxford aesthetic
- [ ] Type "Inflation" in the hero search and press Enter — a Swahili result card appears
- [ ] Search "Inflation" a second time — the card shows "From Ledger" (cache hit)
- [ ] The Daily Ledger section shows either live AV news or the editorial fallback cards
- [ ] Visit [http://localhost:3000/nonexistent-page](http://localhost:3000/nonexistent-page) — the 404 concierge card appears

If any step fails, the error will be logged in your terminal — the server-only modules print descriptive messages for missing env vars.

---

## Stage 6 — Push to GitHub (5 minutes)

### 6.1 Initialise the repository

```bash
cd punt-finance
git init
git add .
git status   # Verify .env.local does NOT appear in the list
git commit -m "feat: Punt Finance — Phase 1-4 complete"
```

### 6.2 Create a GitHub repository

1. Go to [github.com/new](https://github.com/new).
2. Name the repo `punt-finance`. Keep it **Private** for now.
3. Do **not** initialise with a README (your local repo already has files).
4. Click **Create repository**.
5. Run the commands GitHub shows you under "push an existing repository":

```bash
git remote add origin https://github.com/YOUR_USERNAME/punt-finance.git
git branch -M main
git push -u origin main
```

---

## Stage 7 — Deploy to Vercel (10 minutes)

### 7.1 Import the project

1. Go to [vercel.com/new](https://vercel.com/new) and sign in.
2. Click **Import Git Repository**.
3. Authorise Vercel to access your GitHub account if prompted.
4. Find `punt-finance` in the list and click **Import**.

### 7.2 Configure the project

On the configuration screen:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** `.` (leave as default)
- **Build Command:** `npm run build` (leave as default)
- **Output Directory:** `.next` (leave as default)
- **Node.js Version:** Select **20.x**

### 7.3 Add environment variables

Click **Environment Variables**. Add each of the 10 variables from your `.env.local` one by one. For `NEXT_PUBLIC_SITE_URL`, use your Vercel domain (e.g. `https://punt-finance.vercel.app`) — you will get this URL after the first deploy.

> **Important:** For `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `IP_HASH_SALT`, and `REVALIDATE_SECRET` — set the **Environment** dropdown to **Production only**. These must never appear in preview deployments or be accessible to other developers.

### 7.4 Deploy

Click **Deploy**. Vercel will:
1. Clone your repository
2. Run `npm install`
3. Run `npm run build` (TypeScript compile + Next.js build)
4. Deploy to its global edge network

The first deploy takes ~2 minutes. When it finishes, you will see a green ✓ and a live URL.

### 7.5 Update NEXT_PUBLIC_SITE_URL

1. Copy your live Vercel URL (e.g. `https://punt-finance.vercel.app`).
2. In Vercel: **Settings → Environment Variables → NEXT_PUBLIC_SITE_URL → Edit**.
3. Set the value to your live URL. Click **Save**.
4. Go to **Deployments** and click **Redeploy** on the latest deployment (select "Redeploy with existing build cache" = **off** to pick up the new env var).

---

## Stage 8 — Verify Production (5 minutes)

Visit your live URL and run through this production checklist:

| Test | Expected result |
|---|---|
| Homepage loads | Ivory background, Oxford Blue serif heading |
| Search "Short Selling" | Result card with Swahili explanation appears |
| Search "Short Selling" again | Card shows "From Ledger" badge (DB cache hit) |
| Search 6 times quickly | Rate limit message: "The ledger is currently processing high volumes…" |
| Visit `/nonexistent-route` | Typeset 404 concierge card |
| View page source | No `ANTHROPIC_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` present anywhere |
| Browser DevTools → Network | No requests to `alphavantage.co` or `api.anthropic.com` from the browser |
| Response headers | `X-Frame-Options: DENY`, `Content-Security-Policy` present |

---

## Stage 9 — Custom Domain (Optional, 5 minutes)

If you own the domain `puntfinance.com`:

1. In Vercel: **Settings → Domains → Add Domain**.
2. Enter `puntfinance.com`. Vercel will show you DNS records to add.
3. In your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.), add the records.
4. DNS propagation takes 5–60 minutes.
5. Update `NEXT_PUBLIC_SITE_URL` to `https://puntfinance.com`.
6. Update the `www` redirect in `next.config.ts` — it is already configured.

---

## Ongoing Operations

### Forcing a news refresh manually

The Daily Ledger auto-refreshes every 6 hours via the Vercel cron job. To force an immediate refresh:

```bash
curl -X POST https://your-domain.vercel.app/api/revalidate-ledger \
  -H "Authorization: Bearer YOUR_REVALIDATE_SECRET"
```

### Deploying code updates

Every `git push` to `main` triggers an automatic Vercel redeploy:

```bash
git add .
git commit -m "feat: your change description"
git push origin main
```

### Monitoring

- **Vercel logs:** Dashboard → your project → Functions tab (server logs)
- **Supabase:** Table Editor → `search_audit_log` (all searches with latency)
- **Upstash:** Console → Analytics (rate limit hits per IP per day)

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails: "ANTHROPIC_API_KEY not set" | Env var missing in Vercel | Add it under Settings → Env Variables → Redeploy |
| Search returns "AI engine encountered a difficulty" | Wrong/expired Anthropic key | Rotate key at console.anthropic.com |
| Daily Ledger shows editorial fallback | Alpha Vantage key invalid or rate-limited | Check key at alphavantage.co; free tier = 25 calls/day |
| Rate limit fires after 1 search | Upstash URL/token wrong | Verify both in Upstash console REST API tab |
| "SUPABASE_SERVICE_ROLE_KEY is not configured" | Server-only env var missing | Add in Vercel, never prefix with NEXT_PUBLIC_ |
| TypeScript build error | `tsconfig.json` path alias issue | Ensure `"paths": {"@/*": ["./*"]}` is in tsconfig.json |

---

*Punt Finance · Phase 4 · Production Deployment Guide*
