# HubSpot Import Pipeline

**Date:** 2026-02-23
**Status:** Built + dry-run verified, not yet run live
**Branch:** `main` (uncommitted)

## What Was Built

### hubspot.ts — 6 New Functions + 1 Type + 1 Helper

**File:** `APP/src/lib/integrations/hubspot.ts`

| Addition | Purpose |
|----------|---------|
| `HSPropertyCreate` type | Typed definition for creating custom properties |
| `normalizeDomain()` | Strip protocol/www/path, lowercase — used for domain matching |
| `getCompanyProperties()` | Fetch all company property definitions (mirrors `getContactProperties`) |
| `createPropertyGroup()` | Create property group on any object type, handles 409 (already exists) |
| `createProperty()` | Create custom property on any object type, handles 409 |
| `updateCompany()` | PATCH existing company by ID |
| `batchUpsertCompanies()` | Search by domain → create or update, 200ms delay between calls |
| `batchAssociateContactsToCompanies()` | Batch v4 associations, chunked by 500 |

### Test Script

**File:** `APP/scripts/test-hubspot-import.ts`

```bash
npx tsx scripts/test-hubspot-import.ts --dry-run        # Parse CSV, show mapping, no API calls
npx tsx scripts/test-hubspot-import.ts --count 5         # Live: create properties + upsert 5 records
npx tsx scripts/test-hubspot-import.ts --cleanup         # Archive test contacts (test-backpack.dev)
```

**Steps the script runs:**
1. Validate HubSpot access token
2. Parse Euro Seed CSV (`GTM/campaigns:23-02/Company-List-or-Euro-Seed-*.csv` — 241 rows)
3. Map CSV columns → HubSpot properties
4. Create `backpack` property group on companies + contacts
5. Create 16 custom properties (8 company, 8 contact)
6. Upsert companies (search by domain → create or update)
7. Upsert contacts (synthetic emails: `testN.{company}@test-backpack.dev`)
8. Associate contacts → companies
9. Verify by reading back one company + one contact

## Custom Properties (16 total)

### Company (8) — group: `backpack`

| Property | Type | Field |
|----------|------|-------|
| `backpack_funding_amount` | string | text |
| `backpack_funding_date` | date | date |
| `backpack_funding_type` | enumeration | select (Seed, Pre-Seed, Series A/B/C+) |
| `backpack_qualification_status` | enumeration | select (Qualified, Disqualified, Pending, Needs Review) |
| `backpack_campaign_cohort` | enumeration | select (Euro Seed, US Seed, Euro Series A) |
| `backpack_company_rank` | number | number |
| `backpack_icp_score` | number | number |
| `backpack_prospect_count` | number | number |

### Contact (8) — group: `backpack`

| Property | Type | Field |
|----------|------|-------|
| `backpack_linkedin_url` | string | text |
| `backpack_vmid` | string | text |
| `backpack_prospect_score` | number | number |
| `backpack_prospect_rank` | number | number |
| `backpack_persona_fit` | enumeration | select (Strong/Moderate/Weak Fit) |
| `backpack_qualification_status` | enumeration | select (same as company) |
| `backpack_professional_summary` | string | textarea |
| `backpack_campaign_cohort` | enumeration | select (same as company) |

## CSV → HubSpot Field Mapping

| CSV Column | HubSpot Property |
|------------|-----------------|
| `Organization Name` | `name` (standard) |
| `xAI / Website` (fallback: `Website`) | `domain` (standard, via `normalizeDomain`) |
| `Country` | `country` (standard) |
| `Employee Count` | `numberofemployees` (standard) |
| `Description` | `description` (standard) |
| `Last Funding Amount` | `backpack_funding_amount` (custom) |
| `Last Funding Date` | `backpack_funding_date` (custom, parsed to ISO date) |
| `Last Funding Type` | `backpack_funding_type` (custom) |
| `xAI / Qualification Status` | `backpack_qualification_status` (custom) |
| hardcoded `"Euro Seed"` | `backpack_campaign_cohort` (custom) |

## Dry Run Output (verified)

```
Total rows: 241
Using first 5 rows:

  [1] Cyb3r Operations — cyb3roperations.com — GB — 13 employees — €4,600,000 Seed — Qualified
  [2] United Manufacturing Hub — umh.app — DE — 26 employees — €5,000,000 Seed — Qualified
  [3] Geordie AI — geordie.ai — GB — 29 employees — $6,500,000 Seed — Qualified
  [4] Allos — allos.ai — US — 15 employees — $5,000,000 Seed — Qualified
  [5] Mercura — mercura.ai — de — 17 employees — $2,100,000 Seed — Qualified
```

## Next Steps

1. Run live: `npx tsx scripts/test-hubspot-import.ts --count 5`
2. Verify in HubSpot that properties + companies + contacts are created correctly
3. If good, run full import: `npx tsx scripts/test-hubspot-import.ts --count 241`
4. Extend script for US Seed and Euro Series A CSVs
5. Add real contact import (with actual emails from Clay prospect data)
