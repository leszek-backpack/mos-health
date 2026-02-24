# HeyReach — LinkedIn Outreach

## Auth
- **Env var:** `HEYREACH_API_KEY`
- **Base URL:** `https://api.heyreach.io/api/public`
- **Rate limit:** 300 req/min
- MCP connector available in Mos Health for conversational queries

## Key Functions

**Campaigns**
- `getAllCampaigns(params?)` → list all campaigns
- `getCampaignById(campaignId)` → single campaign + `campaignAccountIds`
- `pauseCampaign(id)` / `resumeCampaign(id)`

**Leads**
- `addLeadsToCampaignV2(apiKey, campaignId, accountLeadPairs[])` → auto-batches in 100s
- `updateLeadStatus(leadId, status)`

**Conversations**
- `getConversationsV2(apiKey, linkedInAccountIds[], {offset?, limit?, searchString?})`
- `sendMessage(apiKey, linkedInAccountId, conversationId, message)`

**Stats**
- `getOverallStats(apiKey, {accountIds?, campaignIds?, startDate?, endDate?})`
  - Endpoint: `/stats/GetOverallStats` (NOT `/campaign/GetOverallStats`)
  - Both `startDate` + `endDate` required, full ISO 8601 UTC format

## Quirks
- `firstName` + `lastName` both required — use `"."` as fallback for missing lastName
- Cannot add leads to `DRAFT` campaigns (400 error)
- `li_account/GetAll` may return 0 accounts — fallback: use `campaignAccountIds` from `getCampaignById()`
- Active workspace API key ends with `...csHM=` — two keys exist, only one works

## Campaign Statuses
`DRAFT | IN_PROGRESS | PAUSED | FINISHED | CANCELED | FAILED | STARTING | SCHEDULED`

## MCP Tools (Mos Health only)
Load via `ToolSearch` → `+heyreach`:
- `get_all_campaigns`, `get_lead`, `get_all_linked_in_accounts`, `get_conversations_v2`, `send_message`
