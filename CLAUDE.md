# Mos Health OS

Natalia's AI-powered workspace for Mos Health GTM operations. Claude Code is the engine — you talk, it executes.

## Who Uses This
**Natalia** — works at Mos Health. Not a developer. Uses Claude Code as a tool runner via Cursor's terminal.

## What You Can Do

| Command | What happens |
|---------|-------------|
| "Generate a brief for [LinkedIn URL]" | Full pre-call intelligence brief → Google Doc |
| "Research [company name]" | Clay enrichment + web research on a target account |
| "Enrich [LinkedIn URL]" | LinkedIn profile + company data via RapidAPI |
| "Find contacts at [company]" | Clay contact search + enrichment |
| "Check my Notion for [topic]" | Search and read Notion workspace |
| "Add notes to Notion about [meeting]" | Create/update Notion pages |
| "Show me all deals in HubSpot" | Search and filter CRM records |
| "Create a contact in HubSpot for [name]" | Create/update CRM objects |
| "Show my HeyReach campaigns" | List campaigns, stats, leads |
| "Add [LinkedIn URL] to [campaign]" | Add leads to HeyReach campaigns |
| "Show conversations from [campaign]" | Read LinkedIn messages and replies |
| "Pause [campaign name]" | Pause/resume HeyReach campaigns |

---

## Feature 1: Pre-Call Brief Generator

When the user says **"Generate a brief for [LinkedIn URL]"**, follow these 7 steps exactly:

### Step 1: Fetch LinkedIn Data
```bash
npx tsx briefs/scripts/fetch-linkedin.ts --url <linkedin_url>
```
Read the output from `output/linkedin-data.json`.

### Step 2: Classify Meeting Type + Persona
Read `briefs/prompts/persona-classifier.md`. Classify:
- **Meeting type:** `sales` | `relationship` | `vc`
- **Persona (sales only):** `founder` | `hr_leader` | `employee_champion`

### Step 3: Analyze Worldview + Health Signals
Read `briefs/prompts/worldview-analysis.md`. Analyze posts, comments, bio for psychographics and sport/health signals.

### Step 4: Research Company Intelligence
Read `briefs/prompts/research-guidelines.md`. Use **WebSearch** for: careers page, job listings, company news, prospect personal intel.

### Step 5: Generate the Brief
Based on meeting type, read the appropriate prompt chain:

| Meeting Type | Prompt | Question Source |
|---|---|---|
| Sales → Founder | `briefs/prompts/brief-sales.md` then `briefs/prompts/brief-questions-founder.md` | `briefs/questions/founder.json` |
| Sales → HR Leader | `briefs/prompts/brief-sales.md` then `briefs/prompts/brief-questions-hr.md` | `briefs/questions/hr-leader.md` |
| Sales → Champion | `briefs/prompts/brief-sales.md` then `briefs/prompts/brief-questions-champion.md` | `briefs/questions/employee-champion.md` |
| VC / Investor | `briefs/prompts/brief-vc.md` | (talking points, not questions) |
| Relationship | `briefs/prompts/brief-relationship.md` | `briefs/questions/relationship.md` |

**Always also read:** `context/mos-health.md`, `context/patrycja.md`, `context/benefits-dictionary.md`, `briefs/prompts/output-format.md`

For **sales briefs**, two-part generation:
1. **Sections 1-2** via `brief-sales.md` → outputs decision variables
2. **Section 3** via persona-specific prompt → selects 8-12 questions based on decision variables

### Step 6: Write HTML to File
```
output/<firstname-lastname>-brief.html
```

### Step 7: Create Google Doc
```bash
npx tsx briefs/scripts/create-google-doc.ts --title "Pre-Call Brief — <Full Name>" --html-file output/<firstname-lastname>-brief.html
```
Return the Google Doc URL.

---

## Feature 2: Clay Enrichment

Clay tools are available natively (connected via Claude.ai Settings → Connectors). Use them for:
- **Company enrichment:** `find-and-enrich-company` — firmographics, funding, tech stack
- **Contact search:** `find-and-enrich-contacts-at-company` — find decision makers
- **Contact enrichment:** `find-and-enrich-list-of-contacts` — emails, titles, social profiles
- **Custom data:** `add-company-data-points` / `add-contact-data-points`
- **Subroutines:** `list_subroutines` / `run_subroutine` — run saved Clay workflows

When asked to research a company or find contacts, use Clay tools first, then supplement with web search.

---

## Feature 3: LinkedIn Research (RapidAPI)

**Provider:** SaleLeads.ai — Fresh LinkedIn Scraper API
**Script:** `briefs/scripts/fetch-linkedin.ts` handles profile + posts + comments + company data.

For ad-hoc LinkedIn queries beyond brief generation:
- Profile: `GET /api/v1/user/profile?username={username}&include_experiences=true`
- Posts: `GET /api/v1/user/posts?username={username}`
- Comments: `GET /api/v1/user/comments?username={username}`
- Company: `GET /api/v1/company/profile?company_id={id}`
- Jobs: `GET /api/v1/company/jobs?company_id={id}`

**Quirks:** Experience nested as `{ total, has_more, data: [...] }`. Company IDs are numeric. Current job = `date.end === "Present"`. Rate limit: 3s between calls.

---

## Feature 4: HubSpot CRM

**Primary:** MCP connector (configured in `.mcp.json`, authenticates via `/mcp` → OAuth). Use this for everyday queries.
**Fallback:** Direct API via `integrations/hubspot.ts` using `HUBSPOT_ACCESS_TOKEN` from `.env`. Use for batch operations or anything the MCP connector can't do.

To use: import functions from `integrations/hubspot.ts` in a script, or write inline. All functions take `apiKey?: string` as first param — pass `undefined` to use env var.

**Contacts:**
- `findContactByEmail(apiKey?, email)` → contact ID or null
- `searchContacts(apiKey?, filters, properties?, limit?)` → contacts array
- `getContactTouchpoints(apiKey?, contactId)` → full contact details + notes
- `batchCheckContacts(apiKey?, [{email, vmid?}])` → batch lookup (100 at a time)
- `importContacts(apiKey?, contacts[])` → upsert one-by-one (create or update)
- `batchUpsertContacts(apiKey?, contacts[])` → batch upsert (faster, up to 100)

**Companies:**
- `searchCompanyByDomain(apiKey?, domain)` → company or null
- `createCompany(apiKey?, {name, domain, industry, ...})` → company ID
- `associateContactToCompany(apiKey?, contactId, companyId)`

**Deals:**
- `createDeal(apiKey?, {dealname, amount, dealstage, ...})` → deal ID
- `updateDeal(apiKey?, dealId, properties)`
- `associateDealToContact(apiKey?, dealId, contactId)`
- `associateDealToCompany(apiKey?, dealId, companyId)`

**Notes & Emails:**
- `createNote(apiKey?, contactId, body, timestamp?)` → note ID (supports HTML)
- `logEmail(apiKey?, contactId, subject, body, timestamp?)` → email ID

**Properties:**
- `getContactProperties(apiKey?)` → all writable property definitions (cached 5min)

---

## Feature 5: HeyReach (LinkedIn Outreach)

**Primary:** MCP connector (configured in `.mcp.json`, authenticates via `/mcp` → OAuth). Use this for everyday queries.
**Fallback:** Direct API via `integrations/heyreach.ts` using `HEYREACH_API_KEY` from `.env`. Use for batch operations or anything the MCP connector can't do.

To use: import functions from `integrations/heyreach.ts` in a script, or write inline. All functions take `apiKey` as first param.

**Campaigns:**
- `getAllCampaigns(apiKey, {offset?, limit?})` → list campaigns
- `getCampaignById(apiKey, campaignId)` → single campaign details
- `pauseCampaign(apiKey, campaignId)` → pause a running campaign
- `resumeCampaign(apiKey, campaignId)` → resume a paused campaign

**Leads:**
- `addLeadsToCampaignV2(apiKey, campaignId, accountLeadPairs[])` → add leads (auto-batches in 100s)
  - **Quirk:** `firstName` + `lastName` both required (use `"."` for missing lastName)
  - **Quirk:** Cannot add to DRAFT campaigns

**LinkedIn Accounts:**
- `getLinkedInAccounts(apiKey, {offset?, limit?, keyword?})` → connected accounts

**Conversations:**
- `getConversationsV2(apiKey, linkedInAccountIds[], {offset?, limit?, searchString?})` → inbox messages
- `sendMessage(apiKey, linkedInAccountId, conversationId, message)` → send reply

**Stats:**
- `getOverallStats(apiKey, {accountIds?, campaignIds?, startDate?, endDate?})` → campaign performance (connections, replies, acceptance rates)

**Campaign Statuses:** `DRAFT | IN_PROGRESS | PAUSED | FINISHED | CANCELED | FAILED | STARTING | SCHEDULED`

---

## Feature 6: Notion Integration

Notion MCP is connected via `.mcp.json`. Use it to:
- **Search** pages and databases in the Mos Health workspace
- **Read** meeting notes, pipeline data, account info
- **Create** new pages (meeting notes, account research, follow-ups)
- **Update** existing pages (add notes, change status, log activities)
- **Query** databases with filters (e.g. "show me all accounts in pipeline")

---

## Project Structure

```
mos-health/
├── CLAUDE.md              # This file — all instructions
├── ONBOARDING.md          # Setup guide for new users
├── .mcp.json              # MCP servers (Notion)
├── .env.example           # Required API keys
├── .claude/settings.json  # Permissions config
│
├── context/               # Shared company context
│   ├── mos-health.md      # Product, ICP, pricing, competitors
│   ├── patrycja.md        # CEO bio + common ground detection
│   ├── benefits-dictionary.md  # Benefits scoring rubric
│   └── decision-variables.md   # Conditional variable reference
│
├── briefs/                # Pre-call brief generator
│   ├── prompts/           # 11 prompt files (classifier, analysis, brief variants)
│   ├── questions/         # 4 question libraries (founder, HR, champion, relationship)
│   ├── scripts/           # fetch-linkedin.ts, create-google-doc.ts, smoke tests
│   └── output/            # Generated HTML briefs
│
├── integrations/          # API clients (HubSpot, HeyReach)
│   ├── hubspot.ts         # 18 functions — contacts, companies, deals, notes
│   └── heyreach.ts        # 14 functions — campaigns, leads, conversations, stats
│
├── campaign-context/      # PDFs (sales narrative, brand book, ICP, playbook, etc.)
└── output/                # General output directory
```

## Brief Quality Rules

1. **Be specific.** No generic labels. Describe actual policies, perks, culture.
2. **"Not found" over guessing.** If data isn't available, say so. Never invent.
3. **All news needs source URLs.** Every news item must cite its source.
4. **Never pitch.** Discovery questions probe past behavior, not hypotheticals. Mom Test principles.
5. **Green flag questions (✦)** are Patrycja's top picks — every section must include at least one.
6. **8-12 questions per sales call.** Spread across sections per persona pick counts.
7. **Personalize the opener.** If health/sport signals detected, use the health-signal variant.
8. **HTML output only.** Follow `briefs/prompts/output-format.md` exactly.

## Error Handling

- If `fetch-linkedin.ts` fails → tell user, suggest checking `RAPIDAPI_KEY`
- If company data is missing → generate brief with available data
- If `create-google-doc.ts` fails → HTML file is still in `output/`
- If a Clay tool fails → fall back to web search
- If HubSpot call fails → check `HUBSPOT_ACCESS_TOKEN` in `.env`
- If HeyReach call fails → check `HEYREACH_API_KEY` in `.env`
- If Notion is disconnected → tell user to run `/mcp` to reconnect

## Environment Variables

```bash
RAPIDAPI_KEY=                      # LinkedIn scraping (RapidAPI)
GOOGLE_CLIENT_ID=                  # Google OAuth2 (Doc creation)
GOOGLE_CLIENT_SECRET=              # Google OAuth2
GOOGLE_REFRESH_TOKEN=              # From: npx tsx briefs/scripts/google-auth-setup.ts
GOOGLE_FOLDER_ID=                  # Google Drive folder for briefs
HUBSPOT_ACCESS_TOKEN=              # HubSpot CRM API
HEYREACH_API_KEY=                  # HeyReach LinkedIn outreach API
TRIGGER_SECRET_KEY_PROD=           # Trigger.dev (enrichment pipeline)
GOOGLE_GENERATIVE_AI_API_KEY=      # Gemini (enrichment AI analysis)
```
