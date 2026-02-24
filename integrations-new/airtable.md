# Airtable Integration

## What It Is
Airtable is a database/spreadsheet hybrid used at Backpack AI for tracking data, campaigns, and structured records.

## MCP Server
- **Name:** `airtable` (in root `.mcp.json`)
- **Package:** `airtable-mcp-server` (via npx)
- **Auth:** `AIRTABLE_API_KEY` env var (personal access token)

## Key Operations
The MCP server exposes tools for:
- Listing bases and tables
- Reading records (with filtering, sorting)
- Creating / updating / deleting records
- Searching records

## Auth
- Personal access token: stored in root `.mcp.json` → `env.AIRTABLE_API_KEY`
- Token starts with `patIIuwJNBpZaOXYy.`

## Quirks
- Base IDs start with `app`, table IDs start with `tbl`
- Field names are case-sensitive
- Rate limit: 5 req/sec per base
- Records returned in pages (default 100); use `offset` for pagination
