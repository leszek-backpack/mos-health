# Clay — Data Enrichment & Table Builder

## Access
- **MCP connector** — available via Claude.ai Settings → Connectors (no API key needed)
- Load via `ToolSearch` before using any Clay tools

## MCP Enrichment Tools

| Tool | What it does |
|------|-------------|
| `find-and-enrich-company` | Firmographics, funding, tech stack for a company |
| `find-and-enrich-contacts-at-company` | Find decision makers at a company |
| `find-and-enrich-list-of-contacts` | Emails, titles, social profiles for a list |
| `add-company-data-points` | Add custom data to a company record |
| `add-contact-data-points` | Add custom data to a contact record |
| `list_subroutines` | List saved Clay workflows |
| `run_subroutine` | Run a saved Clay workflow with field mapping |
| `get-credits-available` | Check remaining Clay credits |

## Table Builder (Mos Health)
Full skill reference at `Clients/Mos Health/clay/SKILL.md` (1,700+ lines).

Covers:
- Valid Clay JSON table schemas, column types, action registry
- AI prompts, HTTP API v2, enrichment, third-party integrations
- Formula language (JavaScript-like with Clay helpers)
- Email waterfalls, HubSpot check→create, cross-table pipelines
- Auth accounts, rate limiting, conditional execution

## Workflow
When asked to research a company or find contacts:
1. Use Clay MCP tools first (fastest, no code needed)
2. Supplement with WebSearch if Clay returns incomplete data
3. For bulk operations, build a Clay table
