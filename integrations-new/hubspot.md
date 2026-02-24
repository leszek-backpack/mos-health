# HubSpot CRM

## Auth
- **Env var:** `HUBSPOT_ACCESS_TOKEN` (Private App token, not OAuth)
- All functions accept `apiKey?: string` as first param — pass `undefined` to use env var fallback
- MCP connector available in Mos Health (`.mcp.json`) for conversational queries

## Key Functions (from `APP/src/lib/integrations/hubspot.ts`)

**Contacts**
- `findContactByEmail(apiKey?, email)` → contact ID or null
- `searchContacts(apiKey?, filters, properties?, limit?)`
- `batchUpsertContacts(apiKey?, contacts[])` → 100/batch, returns `{ created, updated, errors }`
- `batchCheckContacts(apiKey?, [{email, vmid?}])`

**Companies**
- `searchCompanyByDomain(apiKey?, domain)` → company or null
- `createCompany(apiKey?, properties)` → company ID
- `associateContactToCompany(apiKey?, contactId, companyId)`

**Deals**
- `createDeal(apiKey?, properties)` → deal ID
- `associateDealToContact / associateDealToCompany`

**Notes & Emails**
- `createNote(apiKey?, contactId, body, timestamp?)` — supports HTML
- `logEmail(apiKey?, contactId, subject, body, timestamp?)`

**Properties**
- `getContactProperties(apiKey?)` → all writable properties (cached 5 min)

## Quirks
- `batchUpsertContacts` response fields: `addedLeadsCount` / `updatedLeadsCount` / `failedLeadsCount`
- Custom properties need property group to exist first — create via `createPropertyGroup()`
- `normalizeDomain()` strips www, http, paths before matching companies
- Check `checkAccessToken()` before using a stored API key — returns bool, 10s timeout, never throws

## MCP Tools (Mos Health only)
Load via `ToolSearch` → `+hubspot`:
- `get_crm_objects`, `search_crm_objects`, `get_properties`, `manage_crm_objects`, `search_owners`
