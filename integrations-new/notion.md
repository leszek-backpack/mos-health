# Notion

## Access
- **MCP connector** — configured in project `.mcp.json` files
- If disconnected: run `/mcp` to reconnect
- Load via `ToolSearch` → `+notion` before using tools

## MCP Tools

| Tool | What it does |
|------|-------------|
| `notion-search` | Search pages and databases by keyword |
| `notion-fetch` | Read a specific page or database by ID/URL |
| `notion-create-pages` | Create new pages (meeting notes, account research) |
| `notion-update-page` | Update existing page (add notes, change status) |
| `notion-create-database` | Create a new database |
| `notion-get-comments` | Read page comments |
| `notion-create-comment` | Add a comment to a page |
| `notion-get-users` | List workspace members |
| `notion-get-teams` | List workspace teams |

## Common Workflows
- **Meeting notes:** `notion-search` for existing page → `notion-update-page` or `notion-create-pages`
- **Pipeline query:** `notion-search` with filter → read database properties
- **Task creation:** `notion-create-pages` in the right database with correct properties

## Notes
- Page IDs can be extracted from Notion URLs: `notion.so/workspace/<page-id>`
- Database queries support filters — always specify a database ID for structured queries
