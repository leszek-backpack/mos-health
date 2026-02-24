# RapidAPI — Fresh LinkedIn Scraper

## Auth
- **Provider:** SaleLeads.ai — `fresh-linkedin-scraper-api.p.rapidapi.com`
- **Env vars:** `RAPIDAPI_KEY`, `RAPIDAPI_HOST`
- **Plan:** PRO (20,000 credits, ~20 req/min rate cap)

## Key Endpoints

**User Profile**
- `GET /api/v1/user/profile?username={username}&include_experiences=true&include_bio=true`
- Returns: `public_identifier`, `full_name`, `headline`, `id` (vmid), `location` (object), `experiences`

**User Posts (with pagination)**
- `GET /api/v1/user/posts?username={username}&page=1`
- Paginate: pass BOTH `page` (incremented) AND `pagination_token` from previous response
- Using `page` alone without token restarts from page 1

**Search Posts**
- `GET /api/v1/search/posts?keyword={keyword}&sort_by=date_posted&date_posted=past_week`
- Date filters: `past_24h`, `past_week`, `past_month` (underscores, NOT hyphens)

**Company**
- `GET /api/v1/company/profile?company={name}` or `?company_id={numeric_id}`

## Response Shape (all endpoints)
```json
{ "success": true, "cost": 1, "total": 50, "has_more": true, "data": {...} }
```

## Quirks
- `username` (cheaper, -1 credit) vs `url` (full LinkedIn URL)
- Company endpoints: use `company` param (name), NOT `username`
- Current job: `date.end === "Present"` (not a boolean field)
- Experience nested as `{ total, has_more, data: [...] }` — not a flat array
- No separate `/experiences`, `/skills`, `/education` endpoints — use `include_*` params on profile

## Cost
Profile = 1 credit + 1 per `include_*` flag | Posts = 2 | Comments = 2 | Company = 2

## In APP
All production calls go through `api-proxy` Trigger.dev task on `rapidapiQueue` (rate limiter).
Never call directly from Next.js routes.
