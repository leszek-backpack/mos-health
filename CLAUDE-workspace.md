# Backpack AI — Workspace

## Projects

| Folder | What it is |
|--------|-----------|
| `APP/` | GTM Command Center (Outbound OS) — Next.js 16 app (Railway). Main client product. See `APP/CLAUDE.md`. |
| `Clients/Mos Health/` | Natalia's AI workspace — briefs, LinkedIn research, HeyReach, HubSpot. See `Clients/Mos Health/CLAUDE.md`. |
| `Clients/IC Project/` | IC Project client workspace. See `Clients/IC Project/CLAUDE.md`. |
| `Backpack/` | Backpack AI internal — prompt optimizer, GTM skills library, internal tools. |
| `GTM/` | GTM knowledge base — outreach strategies, messaging frameworks, playbooks. |
| `Integrations/` | Shared integration knowledge — HubSpot, HeyReach, Notion, Clay, n8n, Slack, RapidAPI. |
| `Apps/` | Standalone tools — crawl4ai, careers scraper, data utilities. |
| `Personal/` | Personal projects and experiments. |

## How to Navigate
- **Working on the Next.js app?** → `cd APP/` and read its `CLAUDE.md`
- **Working for Mos Health client?** → `cd Clients/Mos Health/` and read its `CLAUDE.md`
- **Looking for how to call HubSpot/Notion/Clay?** → `Integrations/` folder
- **Need GTM strategy, messaging, or copywriting knowledge?** → `GTM/`

## Documentation Standard (all projects)
Every project folder MUST have:
- `CLAUDE.md` — stack, layout, gotchas, behavioral rules (max 200 lines)
- `.claude/docs/` — deeper reference (architecture, known issues, UI map) — loaded on demand
- `tasks/lessons.md` — patterns and fixes from past debugging sessions

### Clay Tables
Every Clay table (JSON schema file) MUST have a companion `<table-name>.md` in the same folder:
- Pipeline overview (how tables connect)
- Column-by-column breakdown (name, type, what it does)
- Signal taxonomy or scoring logic (if AI is involved)
- Key output columns called out explicitly
- Auth account IDs and which columns use them
- Gotchas (fuzzy matches, date formats, API quirks)

## New Project Checklist
1. Create folder with `CLAUDE.md` (stack + gotchas)
2. Add row to the table above
3. Add `.claude/docs/` for architecture reference
4. Link shared integrations via `@../../Integrations/<service>.md`
