# Integrations — Shared Knowledge Hub

Reusable integration docs for all projects. When you need to connect to any of these services,
read the relevant file first. Referenced from client and project CLAUDE.md files via `@`.

## Available Integrations

| File | Service | Used by |
|------|---------|---------|
| `hubspot.md` | HubSpot CRM — contacts, companies, deals, notes | APP, Mos Health |
| `heyreach.md` | HeyReach — LinkedIn outreach campaigns, conversations | APP, Mos Health |
| `clay.md` | Clay — data enrichment, table builder, subroutines | Mos Health, GTM |
| `rapidapi.md` | RapidAPI / Fresh LinkedIn Scraper — profiles, posts, companies | APP, Mos Health, Apps/scripts |
| `notion.md` | Notion — pages, databases, meeting notes | Mos Health |
| `n8n.md` | n8n — workflow automation, webhook triggers | Mos Health, Backpack |
| `slack.md` | Slack — messaging, channel reads, notifications | APP, Backpack |
| `airtable.md` | Airtable — database/spreadsheet records | Backpack internal |
| `useresume.md` | UseResume — CV management (personal) | Personal |

## MCP Servers

All MCP configs are in **`claude-code-leszek/.mcp.json`** (workspace root) — available in all projects.
`APP/.mcp.json` adds `maestro-status` (APP-only, Maestro UI automation).

| MCP Name | Service | Config location |
|----------|---------|----------------|
| `notion-backpack` | Notion | root `.mcp.json` |
| `hubspot-backpack` | HubSpot | root `.mcp.json` |
| `heyreach-backpack` | HeyReach | root `.mcp.json` |
| `airtable` | Airtable | root `.mcp.json` |
| `useresume` | UseResume | root `.mcp.json` |
| `maestro-status` | Maestro (UI automation) | `APP/.mcp.json` |
| `mcp__claude_ai_Clay` | Clay enrichment | Claude.ai (cloud) |
| `mcp__claude_ai_n8n` | n8n workflows | Claude.ai (cloud) |
| `mcp__claude_ai_Slack` | Slack | Claude.ai (cloud) |

## Auth Pattern
Each file lists required env vars. All API keys stored in project-level `.env` files or `.mcp.json` — never hardcoded in source.

## Adding a New Integration
1. Create `<service>.md` with: what it does, auth, key functions/endpoints, quirks
2. Add a row to the table above
3. Add MCP entry to root `.mcp.json` if there's an MCP server
4. Reference from relevant project CLAUDE.md: `@../../Integrations/<service>.md`
