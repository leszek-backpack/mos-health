# UseResume Integration

## What It Is
UseResume is a CV/resume management platform. Used personally (not for clients) — keeps Leszek's CV up to date and accessible.

## MCP Server
- **Name:** `useresume` (in root `.mcp.json`)
- **Package:** `@useresume/mcp-server` (via npx)
- **Auth:** `USERESUME_API_KEY` env var

## Auth
- API key stored in root `.mcp.json` → `env.USERESUME_API_KEY`
- Key prefix: `ur_live_`

## Usage
- Personal use only — updating/reading CV content
- Not used in client projects or APP
