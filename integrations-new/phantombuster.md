# PhantomBuster Integration

## What It Is
PhantomBuster is a LinkedIn automation platform used to scrape Post Likers and run Auto Commenter workflows. Key use case: identifying who liked specific LinkedIn posts (influencer monitoring) and turning them into prospects.

## Auth
- **API key:** `PHANTOMBUSTER_API_KEY` env var
- **Session cookie:** LinkedIn session cookie stored in the PhantomBuster agent config (not in env) — preserved automatically by `launchPostLikersScrape()`

## APP Integration
**File:** `src/lib/integrations/phantombuster.ts`

### Key Functions

#### `launchPostLikersScrape(postUrl, options?)`
Launches the Post Likers scraper agent for a given LinkedIn post URL.
- **ALWAYS use this**, never call `launchAgent()` directly for post likers
- Reason: merges args with existing agent config to preserve `sessionCookie` — calling `launchAgent()` directly overwrites the cookie and breaks auth

#### `getAgentStatus(agentId)`
Returns current run status of an agent.

#### `fetchAgentResults(agentId)`
Downloads scraped results (CSV S3 URL or JSON) from a completed agent run.

### Gotchas
- **Never call `launchAgent()` directly for post likers** — use `launchPostLikersScrape()` to preserve `sessionCookie`
- Results are paginated S3 CSVs — download and parse, don't assume single response
- Agent runs are async — poll `getAgentStatus()` until `status === "finished"` before fetching results
- PhantomBuster rate limits: respect cooldowns between runs to avoid LinkedIn blocks

## Scripts (Apps/scripts/)

| Script | What it does |
|--------|-------------|
| `phantombuster-influencer-monitoring.py` | Full influencer monitoring: RapidAPI posts → PB Post Likers → Supabase → Clay. **Likely production.** |
| `phantombuster-full-workflow.py` | Extended version with retry logic. Reference/archive. |
| `phantombuster-enrich-results-send-to-clay.py` | Enrich existing PB CSVs → Supabase + Clay (no new scrape). |

All scripts read config from `config.json` in the same directory:
```json
{
  "api_keys": {
    "phantombuster": "<key>",
    "rapidapi": "<key>"
  },
  "supabase": { "url": "...", "key": "..." },
  "clay_webhook_url": "...",
  "linkedin_usernames": ["user1", "user2"]
}
```

## Agents Used
- **Post Likers Scraper** — scrapes all users who liked a specific LinkedIn post
- **Auto Commenter** — reads comments from Google Sheet and posts them on LinkedIn (reads via Google Sheets integration)

## Workflow: Influencer Monitoring
1. Fetch recent posts for tracked LinkedIn users (via RapidAPI)
2. Check Supabase — skip already-tracked posts
3. `launchPostLikersScrape(postUrl)` for each new post
4. Poll `getAgentStatus()` until finished
5. Download + deduplicate results
6. Upload prospects to Supabase
7. Send to Clay via webhook
