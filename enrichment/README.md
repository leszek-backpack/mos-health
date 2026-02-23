# LinkedIn Personalization Signal Enrichment Pipeline

Enriches a CSV of 1000+ LinkedIn prospects with AI-generated personalization signals for outreach. Built for Mos Health's B2B campaign targeting SF-based HR/People leaders at tech startups (50-500 employees).

## What It Does

For each LinkedIn username in your CSV:

1. **Fetches profile** (name, headline, location) + experience + education via RapidAPI
2. **Fetches posts** (paginated, up to 60 posts, 1.5yr lookback window)
3. **Analyzes with Gemini** across 10 signal categories to find personalization hooks
4. **Writes to output CSV** with primary hook, backup hook, quality tier, and all signals

All RapidAPI calls route through the Railway app's Trigger.dev `api-proxy` queue (concurrency: 1, 3.5s delay) to respect rate limits and share the queue with production.

## Signal Taxonomy (10 Categories)

| Priority | Category | Why It Converts |
|----------|----------|----------------|
| A+ | Athletic/Fitness | Direct product alignment — they live the category |
| A+ | Wellness/Health | Exact category match — biohacking, meditation, nutrition |
| A | Culture/Values | Buyer intent — publicly advocates for employee wellbeing |
| A- | Parenting/Family | Deep burnout empathy — they feel the problem personally |
| A- | Career Transition | Timing — new role = evaluating benefits = buying window |
| B+ | Personal Achievement | Warm opener + recency ("congrats on the keynote!") |
| B | Hobby/Passion | Shows you see the whole person (cooking, travel, pets) |
| B | Community/Volunteering | Values alignment, especially charity runs |
| B- | Education | College sports teams, health-related degrees |
| B- | Content Creation | Frequent posters are more responsive to outreach |

### Combination Tiers (Highest Conversion)

- **Tier 1:** Fitness/Wellness + Culture Advocate + New Role = near-certain meeting
- **Tier 1:** Wellness Advocate + Active Content Creator with culture posts
- **Tier 1:** Fitness + Recently Hired at Growing Company
- **Tier 2:** Any single A+/A category with high confidence, or two B+ signals
- **Tier 3:** Only B/B- signals, or low confidence findings

### Avoid Topics

The AI is instructed to never reference: health struggles, weight loss, politics, religion, grief, or anything that can only be inferred (not explicitly stated).

## Setup

### 1. Install dependencies

```bash
cd mos-health
npm install
```

### 2. Add environment variables to `.env`

```bash
# Already have from existing setup:
RAPIDAPI_KEY=your_key

# New — get from Railway Trigger.dev project settings:
TRIGGER_SECRET_KEY_PROD=tr_prod_xxx

# New — get from Google AI Studio (https://aistudio.google.com/apikey):
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
```

### 3. Place your input CSV

Put your prospect CSV in `enrichment/input/prospects.csv`. The CSV must have a `public_identifier` column (LinkedIn username, e.g. `jane-doe-123`).

Example:
```csv
public_identifier,name,company
jane-doe-123,Jane Doe,Acme Corp
john-smith-456,John Smith,BigTech Inc
```

You can change the column name in `enrichment/config.json` via `username_column`.

## Usage

All commands run from the `mos-health/` root:

```bash
# Dry run — validate CSV, show counts, don't fetch anything
npx tsx enrichment/enrich-signals.ts --dry-run

# Test with 1 person
npx tsx enrichment/enrich-signals.ts --limit 1

# Test with 10 people
npx tsx enrichment/enrich-signals.ts --limit 10

# Full run (all people in CSV)
npx tsx enrichment/enrich-signals.ts

# Custom config file
npx tsx enrichment/enrich-signals.ts --config path/to/config.json
```

## Output

### CSV (`enrichment/output/enriched-signals.csv`)

| Column | Example |
|--------|---------|
| `username` | `jane-doe-123` |
| `full_name` | `Jane Doe` |
| `headline` | `VP People @ Acme Corp` |
| `primary_hook` | `Congrats on the SF Half Marathon — that's no small feat...` |
| `primary_hook_category` | `athletic_fitness` |
| `primary_hook_confidence` | `high` |
| `backup_hook` | `Your post about rethinking benefits resonated...` |
| `backup_hook_category` | `culture_values` |
| `career_timing` | `new_role_0_3mo` |
| `culture_advocate_score` | `3` |
| `prospect_quality` | `tier1` |
| `signals_found` | `athletic_fitness: marathon (high); culture_values: benefits posts (medium)` |
| `avoid_topics` | |
| `posts_analyzed` | `42` |
| `content_activity` | `high` |
| `error` | |

### Checkpoint (`enrichment/output/checkpoint.json`)

Tracks every processed username. On restart, the script skips already-processed people. Kill mid-run, restart, and it resumes from where it left off (max 1 person of duplicate work).

```json
{
  "processed": { "jane-doe-123": "ok", "john-smith-456": "error" },
  "last_updated": "2026-02-23T14:30:00Z",
  "stats": { "ok": 450, "error": 12, "no_data": 3, "signals_found": { "athletic_fitness": 89 } }
}
```

## Configuration

Edit `enrichment/config.json`:

| Key | Default | Description |
|-----|---------|-------------|
| `input_csv` | `./enrichment/input/prospects.csv` | Path to input CSV |
| `output_csv` | `./enrichment/output/enriched-signals.csv` | Path to output CSV |
| `checkpoint_file` | `./enrichment/output/checkpoint.json` | Checkpoint for resume |
| `username_column` | `public_identifier` | CSV column with LinkedIn usernames |
| `lookback_days` | `548` | How far back to fetch posts (~1.5 years) |
| `max_posts_per_person` | `60` | Max posts to fetch per person |
| `max_post_pages` | `6` | Max pagination pages for posts (10 posts/page) |
| `gemini_model` | `gemini-2.5-flash` | Gemini model for analysis |
| `poll_interval_ms` | `2000` | How often to poll Trigger.dev for task completion |
| `poll_timeout_seconds` | `60` | Max wait time per API call |

## Time & Cost (1000 People)

| Resource | Estimate |
|----------|----------|
| **RapidAPI calls** | ~4000 (1 profile + 1 exp + 1 edu + ~3 post pages avg) |
| **RapidAPI time** | ~3.9 hours (3.5s queue delay per call) |
| **RapidAPI cost** | ~5000 credits (within 20K plan) |
| **Gemini calls** | 1000 (one per person) |
| **Gemini cost** | ~$0.50 total (~10M input tokens at Flash pricing) |
| **Total runtime** | ~4 hours (rate-limited by RapidAPI queue) |

## Architecture

```
Input CSV (1000+ usernames)
  │
  ├─ Step 1: Fetch profile via Trigger.dev api-proxy → RapidAPI
  ├─ Step 2: Fetch experience via api-proxy → RapidAPI
  ├─ Step 3: Fetch education via api-proxy → RapidAPI
  ├─ Step 4: Fetch posts (paginated, 1-6 pages) via api-proxy → RapidAPI
  ├─ Step 5: Gemini structured output analysis (all 10 signal categories)
  ├─ Step 6: Append row to output CSV + update checkpoint
  │
  └─ Repeat for each person (~4-7 API calls + 1 Gemini call per person)
```

### Why Trigger.dev api-proxy?

The RapidAPI rate limit is 20 req/min, shared across the entire Railway app. By routing all calls through the `api-proxy` task on `rapidapiQueue` (concurrency: 1), we get:
- No rate limit conflicts with production
- Built-in retry (3x with exponential backoff)
- Response truncation at 100KB
- Observable in the Trigger.dev dashboard

### Why TypeScript (not Python)?

- The `api-proxy` queue is a Trigger.dev task — the SDK is JS/TS only
- Reuses existing `buildUrl()`/`buildHeaders()` patterns from the Railway app
- Vercel AI SDK already configured for Gemini via `@ai-sdk/google`
- All existing Mos Health scripts are TS run with `npx tsx`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing TRIGGER_SECRET_KEY_PROD` | Add to `.env` — get from Railway project's Trigger.dev settings |
| `Missing GOOGLE_GENERATIVE_AI_API_KEY` | Add to `.env` — get from [Google AI Studio](https://aistudio.google.com/apikey) |
| `Missing RAPIDAPI_KEY` | Already in `.env` from brief generator setup |
| `api-proxy failed` | Check Trigger.dev dashboard for task errors. May be rate limited. |
| `No usernames found in column` | Check your CSV has the right column name (default: `public_identifier`) |
| Script hangs | Check `poll_timeout_seconds` in config. Default 60s per API call. |
| Want to re-process someone | Delete their entry from `enrichment/output/checkpoint.json` |
| Want to start fresh | Delete `checkpoint.json` and `enriched-signals.csv` |
