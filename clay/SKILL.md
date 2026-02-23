# Clay Table Builder — Agent Skill Reference

> **Purpose:** This document teaches AI agents how to generate valid Clay table schemas that can be imported via ClayMate Lite's "Create Columns" feature. Every pattern documented here has been validated against real production tables.

---

## Table of Contents

1. [Schema Format](#1-schema-format)
2. [Column Types](#2-column-types)
3. [Action Registry](#3-action-registry)
4. [AI Actions (use-ai)](#4-ai-actions-use-ai)
5. [HTTP API Actions (http-api-v2)](#5-http-api-actions-http-api-v2)
6. [Built-in Enrichment Actions](#6-built-in-enrichment-actions)
7. [Cross-Table Actions](#7-cross-table-actions)
8. [Third-Party Integration Actions](#8-third-party-integration-actions)
9. [Formula Columns](#9-formula-columns)
10. [Input Binding System](#10-input-binding-system)
11. [Conditional Run Formulas](#11-conditional-run-formulas)
12. [Rate Limit Configurations](#12-rate-limit-configurations)
13. [Common Multi-Column Patterns](#13-common-multi-column-patterns)
14. [Auth Account Reference](#14-auth-account-reference)
15. [Validation Rules & Gotchas](#15-validation-rules--gotchas)

---

## 1. Schema Format

Every Clay table schema follows this top-level structure:

```json
{
  "version": "1.0",
  "exportedAt": "2026-02-22T17:00:00.000Z",
  "columnCount": 10,
  "columns": [ ... ]
}
```

- `version` — Always `"1.0"`
- `exportedAt` — ISO 8601 timestamp of export
- `columnCount` — Must match `columns.length` exactly
- `columns` — Ordered array of column definitions

Each column has:

```json
{
  "index": 0,
  "name": "Column Name",
  "type": "formula",
  "typeSettings": { ... }
}
```

- `index` — Zero-based position (0, 1, 2, ...)
- `name` — Display name (user-defined, any string)
- `type` — One of: `"source"`, `"formula"`, `"action"`, `"text"`, `"number"`
- `typeSettings` — Type-specific configuration object

### Column References

In exported schemas, columns reference each other by **name** using the `{{@Column Name}}` syntax. ClayMate Lite converts these to/from internal field IDs (`{{f_abc123}}`) during import/export.

**Rule:** Always use `{{@Column Name}}` (the portable format), never raw field IDs.

---

## 2. Column Types

### 2.1 Source Column

The first column is usually a source (data input). Two source types exist:

**Webhook source:**
```json
{
  "index": 0,
  "name": "Webhook",
  "type": "source",
  "typeSettings": {
    "sourceIds": [],
    "canCreateRecords": true
  },
  "sourceDetails": [
    {
      "name": "Pull in data from a Webhook",
      "type": "webhook",
      "typeSettings": {
        "hasAuth": false,
        "name": "Webhook",
        "stages": [],
        "iconType": "Webhook",
        "description": "Send any data to Clay",
        "urlSlugText": "Pull in data from a Webhook"
      }
    }
  ]
}
```

**Trigger source** (event-driven, e.g., "new hire detected"):
```json
{
  "index": 0,
  "name": "Trigger",
  "type": "source",
  "typeSettings": {
    "sourceIds": [],
    "canCreateRecords": true,
    "taggedSourceType": {
      "type": "trigger-source"
    }
  }
}
```

**Manual source** (routing from another table):
```json
{
  "index": 0,
  "name": "Source",
  "type": "source",
  "typeSettings": {
    "sourceIds": [],
    "canCreateRecords": true,
    "deleteSourceLinkOnTableRecordDelete": true,
    "recreateTableRecordOnSourceRecordNoop": true,
    "destroySourceRecordOnTableRecordDelete": true
  },
  "sourceDetails": [
    {
      "name": "LinkedIn Personalization Engine",
      "type": "manual",
      "typeSettings": {
        "type": "routing"
      }
    }
  ]
}
```

### 2.2 Formula Column

Computed columns that evaluate JavaScript-like expressions:

```json
{
  "index": 1,
  "name": "Prospect URL",
  "type": "formula",
  "typeSettings": {
    "dataTypeSettings": {
      "type": "url"
    },
    "formulaType": "text",
    "formulaText": "{{@Webhook}}?.[\"prospect_li_url\"]",
    "mappedResultPath": ["prospect_li_url"]
  }
}
```

- `dataTypeSettings.type` — Output type: `"text"`, `"url"`, `"number"`, `"date"`, `"boolean"`, `"email"`
- `formulaType` — Always `"text"` (even for number/boolean outputs)
- `formulaText` — The expression to evaluate
- `mappedResultPath` — Optional. Shortcut for extracting a nested property from a parent column

**Optional formula metadata fields:**
```json
{
  "formulaPrompt": "\"Output today's date\"",
  "dataTypeSettings": {
    "type": "text",
    "label": "Text",
    "iconType": { "displayName": "TextT" }
  }
}
```

`label`/`iconType` are UI-only and optional. `formulaPrompt` stores the natural-language instruction that generated the formula.

### 2.3 Action Column

Server-side execution columns (API calls, enrichments, AI):

```json
{
  "index": 4,
  "name": "Enrich Company",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "enrich-company-with-mixrank-v2",
    "actionVersion": 1,
    "actionPackageId": "e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2",
    "inputsBinding": [ ... ],
    "conditionalRunFormulaText": "{{@Valid Profile?}} == \"Yes\"",
    "customRateLimitRules": { ... },
    "authAccountId": "aa_FfAwz41BuzME"
  }
}
```

- `dataTypeSettings.type` — Always `"json"` for actions
- `actionKey` — Identifies the action type (see [Action Registry](#3-action-registry))
- `actionVersion` — Always `1`
- `actionPackageId` — Package that provides the action
- `inputsBinding` — Array of input parameters
- `conditionalRunFormulaText` — Optional. Expression that must be truthy for the action to run
- `customRateLimitRules` — Optional. Rate limiting config
- `authAccountId` — Optional. Auth account for the action

**Optional action fields:**
- `runAsButton: true` — Makes the action manual (click to run) instead of automatic
- `fromPresetId: "pre__xxxxx"` — Created from a saved preset
- `optionalPathsInInputs` — Fields that are optional in the prompt/body
- `conditionalRunFormulaPrompt` — Human-readable description of the condition
- `delaySettings` — Add delay before running: `{ "type": "delay-seconds", "delayFormulaText": "15" }`

### 2.4 Static Columns (text / number)

User-editable columns with no formula or action:

```json
{
  "index": 2,
  "name": "Notes",
  "type": "text",
  "typeSettings": {}
}
```

```json
{
  "index": 3,
  "name": "Priority",
  "type": "number",
  "typeSettings": {}
}
```

---

## 3. Action Registry

Every action is identified by `actionKey` + `actionPackageId`. Here is the complete registry:

### AI / LLM

| actionKey | actionPackageId |
|---|---|
| `use-ai` | `67ba01e9-1898-4e7d-afe7-7ebe24819a57` |

### Enrichment (MixRank / Clay)

| actionKey | actionPackageId |
|---|---|
| `enrich-company-with-mixrank-v2` | `e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2` |
| `enrich-person-with-mixrank-v2` | `e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2` |
| `find-lists-of-jobs-with-mixrank` | `e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2` |

### HTTP / Table Operations (shared package)

| actionKey | actionPackageId |
|---|---|
| `http-api-v2` | `4299091f-3cd3-4d68-b198-0143575f471d` |
| `lookup-row-in-other-table` | `4299091f-3cd3-4d68-b198-0143575f471d` |
| `lookup-multiple-rows-in-other-table` | `4299091f-3cd3-4d68-b198-0143575f471d` |
| `lookup-record-in-other-table` | `4299091f-3cd3-4d68-b198-0143575f471d` |
| `route-row` | `4299091f-3cd3-4d68-b198-0143575f471d` |

**Note:** `route-row` also uses packageId `b1ab3d5d-b0db-4b30-9251-3f32d8b103c1` in some tables.

### Email Finders

| actionKey | actionPackageId |
|---|---|
| `leadmagic-find-work-email` | `edb58209-a62d-42be-992a-e41b87eeacc2` |
| `prospeo-find-work-email-v2` | `48a31bbb-63e6-4461-8a62-d88bb2cd6b0f` |
| `findymail-find-work-email` | `9515bb04-4267-4074-94eb-653545c3c38f` |

### Google Sheets

| actionKey | actionPackageId |
|---|---|
| `google-sheets-add-row-v2` | `b52dbb55-6b36-4b63-9f8c-21d923353045` |
| `google-sheets-lookup-row-v2` | `b52dbb55-6b36-4b63-9f8c-21d923353045` |

### Campaign / Outreach

| actionKey | actionPackageId |
|---|---|
| `heyreach-add-lead-to-campaign` | `38c1e626-7785-4d36-a993-301bd302aebf` |
| `phantombuster-push-data-v2` | `3ac0ca43-ed34-4662-b69a-82a225f7a005` |

### Airtable

| actionKey | actionPackageId |
|---|---|
| `lookup-field` | `c80f9425-497b-4a13-86a4-3edf0a093c2d` |

---

## 4. AI Actions (use-ai)

The `use-ai` action is the most complex and versatile. It has two modes:

### 4.1 Mode: Claygent (Web Browsing Agent)

The AI can search the web, visit pages, and scrape content.

```json
{
  "name": "useCase",
  "formulaText": "\"claygent\""
}
```

**Use for:** Finding data not in the table (org IDs, funding info, careers pages, LinkedIn data, company research).

### 4.2 Mode: Use AI (Pure LLM)

Standard LLM completion with no web access. Processes only data from the table.

```json
{
  "name": "useCase",
  "formulaText": "\"use-ai\""
}
```

**Use for:** Scoring, classification, property mapping, data transformation, copywriting.

### 4.3 Available Models

| Model | Speed | Cost | Best For |
|---|---|---|---|
| `gpt-4.1-nano` | Fastest | Cheapest | Name normalization, simple lookups |
| `gpt-5-mini` | Fast | Low | Prospect selection, normalization |
| `gpt-5` | Medium | Medium | Segment classification |
| `gemini-2.5-flash` | Fast | Low | General-purpose, profiles, research |
| `gemini-2.5-pro` | Medium | Medium | Complex reasoning, scoring, copywriting |
| `gemini-3-pro` | Slow | High | Deep analysis (employee distribution) |
| `grok-4` | Fast | Medium | Routing, classification |
| `grok-4-1-fast-reasoning` | Fast | Medium | Quick classification with reasoning |
| `deepseek-v3.2` | Medium | Low | Company analysis |
| `claude-sonnet-4-5` | Medium | Medium | Orchestration, briefs |
| `claude-sonnet-4-6` | Medium | Medium | Writing, revision, messaging |
| `claude-opus-4` | Slow | High | Precise URL construction, complex tasks |
| `clay-argon` | Fast | Low | Claygent-optimized web research |

### 4.4 Complete AI Action Template

```json
{
  "index": 6,
  "name": "Prospect Profile",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "use-ai",
    "actionVersion": 1,
    "actionPackageId": "67ba01e9-1898-4e7d-afe7-7ebe24819a57",
    "inputsBinding": [
      {
        "name": "useCase",
        "formulaText": "\"claygent\""
      },
      {
        "name": "prompt",
        "formulaText": "\"Research this LinkedIn profile: \" + Clay.formatForAIPrompt({{@Prospect Li URL}}) + \"\\n\\nFind: 1) Full name 2) Current job title 3) Location\""
      },
      { "name": "temperature" },
      { "name": "reasoningLevel" },
      { "name": "reasoningBudget" },
      { "name": "claygentId" },
      { "name": "claygentFieldMapping" },
      { "name": "maxTokens" },
      {
        "name": "model",
        "formulaText": "\"gemini-2.5-flash\""
      },
      { "name": "maxCostInCents" },
      { "name": "jsonMode" },
      { "name": "systemPrompt" },
      {
        "name": "answerSchemaType",
        "formulaMap": {
          "type": "\"json\"",
          "jsonType": "\"JSONSchema\"",
          "jsonSchema": "\"{\\n  \\\"type\\\": \\\"object\\\",\\n  \\\"properties\\\": {\\n    \\\"fullName\\\": {\\n      \\\"type\\\": \\\"string\\\",\\n      \\\"description\\\": \\\"The prospect's full name\\\"\\n    },\\n    \\\"currentJobTitle\\\": {\\n      \\\"type\\\": \\\"string\\\"\\n    },\\n    \\\"location\\\": {\\n      \\\"type\\\": \\\"string\\\"\\n    }\\n  },\\n  \\\"required\\\": [\\\"fullName\\\", \\\"currentJobTitle\\\", \\\"location\\\"],\\n  \\\"additionalProperties\\\": false\\n}\""
        }
      },
      { "name": "tableExamples" },
      { "name": "stopSequence" },
      {
        "name": "runBudget",
        "formulaText": "3"
      },
      { "name": "topP" },
      { "name": "contextDocumentIds" },
      { "name": "browserbaseContextId" },
      { "name": "mcpSettings" },
      {
        "name": "_metadata",
        "formulaMap": {
          "modelSource": "user"
        }
      }
    ],
    "conditionalRunFormulaText": "{{@Valid Profile?}} == \"Yes\"",
    "customRateLimitRules": {
      "timeWindow": [
        { "limit": 5, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
        { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
      ]
    },
    "authAccountId": "aa_FfAwz41BuzME"
  }
}
```

### 4.5 AI Input Parameters Reference

| Parameter | Required | Type | Description |
|---|---|---|---|
| `useCase` | Yes | formulaText | `"claygent"` or `"use-ai"` |
| `prompt` | Yes | formulaText | The prompt string (with column refs and Clay helpers) |
| `model` | Yes | formulaText | Model identifier string |
| `answerSchemaType` | Recommended | formulaMap | JSON output schema (see below) |
| `_metadata` | Yes | formulaMap | Always `{ "modelSource": "user" }` or `{ "modelSource": "generated" }` |
| `runBudget` | Optional | formulaText | Max cost in dollars: `1`, `1.5`, `3`, `4`, `5`, `7.5`, `8` |
| `temperature` | Optional | formulaText | Temperature value |
| `systemPrompt` | Optional | formulaText | System prompt override |
| `maxTokens` | Optional | formulaText | Max output tokens |
| `metaprompt` | Optional | formulaText | Seed for auto-generated prompt (with `modelSource: "generated"`) |

**All other parameters** should be included with no `formulaText` (empty declaration):
`reasoningLevel`, `reasoningBudget`, `claygentId`, `claygentFieldMapping`, `maxCostInCents`, `jsonMode`, `tableExamples`, `stopSequence`, `topP`, `contextDocumentIds`, `browserbaseContextId`, `mcpSettings`

### 4.6 Answer Schema Types

**Type A: JSONSchema (most common, recommended)**
```json
{
  "name": "answerSchemaType",
  "formulaMap": {
    "type": "\"json\"",
    "jsonType": "\"JSONSchema\"",
    "jsonSchema": "\"{\\n  \\\"type\\\": \\\"object\\\",\\n  \\\"properties\\\": {\\n    \\\"fieldName\\\": {\\n      \\\"type\\\": \\\"string\\\",\\n      \\\"description\\\": \\\"What this field contains\\\"\\n    }\\n  },\\n  \\\"required\\\": [\\\"fieldName\\\"],\\n  \\\"additionalProperties\\\": false\\n}\""
  }
}
```

The `jsonSchema` value is a **double-escaped JSON string** — a JSON Schema wrapped in escaped quotes.

**Supported JSON Schema features:**
- `"type": "string"` — Text output
- `"type": "integer"` — Whole number
- `"type": ["string", "null"]` — Nullable string
- `"type": ["integer", "null"]` — Nullable integer
- `"enum": ["Option A", "Option B"]` — Constrained values
- Nested `"type": "object"` with their own `properties`/`required`
- `"type": "array"` with `"items"` schema
- Always set `"additionalProperties": false` at each object level
- Always set `"required"` with all field names

**Type B: Fields (simpler, less common)**
```json
{
  "name": "answerSchemaType",
  "formulaMap": {
    "type": "\"json\"",
    "jsonType": "\"Fields\"",
    "fields": "{\"response\":{\"type\":\"string\"}}"
  }
}
```

Fields type supports a `"select"` type with color-coded options:
```json
{
  "fields": "{\"Tier\":{\"type\":\"select\",\"options\":\"[{\\\"text\\\":\\\"1\\\",\\\"color\\\":\\\"green\\\"},{\\\"text\\\":\\\"2\\\",\\\"color\\\":\\\"yellow\\\"},{\\\"text\\\":\\\"DQ\\\",\\\"color\\\":\\\"red\\\"}]\"}}"
}
```

**Recommendation:** Use JSONSchema (Type A) for all new tables. It's more explicit and better supported.

### 4.7 Prompt Construction

Build prompts using string concatenation with Clay helpers:

```javascript
// Claygent (web browsing) — provide URLs for the agent to visit
"\"Research this LinkedIn profile: \" + Clay.formatForAIPrompt({{@Prospect Li URL}}) + \"\\n\\nFind:\\n1) Full name\\n2) Current job title\""

// Use AI (pure LLM) — provide data directly
"\"Score this prospect:\\n\\nName: \" + Clay.formatForAIPrompt({{@Name}}) + \"\\nTitle: \" + Clay.formatForAIPrompt({{@Job Title}}) + \"\\nCompany: \" + Clay.formatForAIPrompt({{@Company Name}}) + \"\\nEmployees: \" + Clay.formatForAIPrompt({{@Employee Count}}) + \"\\n\\nScoring rules:\\n- Tier 1: VP+ at 50-500 employee company\\n- DQ: Under 20 employees\""
```

**Rules for prompts:**
- Wrap all column references in `Clay.formatForAIPrompt()`
- Use `\\n` for newlines within the escaped string
- Use `+` for concatenation
- String literals are wrapped in escaped quotes: `\"text\"`
- The entire formulaText is one JavaScript expression that evaluates to a string

---

## 5. HTTP API Actions (http-api-v2)

For calling any REST API (HubSpot, Apollo, Railway proxy, GitHub, etc.).

### 5.1 Complete Template

```json
{
  "index": 10,
  "name": "Search HubSpot",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "http-api-v2",
    "actionVersion": 1,
    "actionPackageId": "4299091f-3cd3-4d68-b198-0143575f471d",
    "inputsBinding": [
      {
        "name": "method",
        "formulaText": "\"POST\""
      },
      {
        "name": "url",
        "formulaText": "\"https://api.hubapi.com/crm/v3/objects/companies/search\""
      },
      { "name": "queryString" },
      {
        "name": "body",
        "formulaText": "\"{\\\"filterGroups\\\":[{\\\"filters\\\":[{\\\"propertyName\\\":\\\"domain\\\",\\\"operator\\\":\\\"EQ\\\",\\\"value\\\":\\\"\" + Clay.formatForJSON({{@Company Domain}}) + \"\\\"}]}],\\\"properties\\\":[\\\"name\\\",\\\"domain\\\",\\\"numberofemployees\\\"],\\\"limit\\\":1}\""
      },
      {
        "name": "headers",
        "formulaMap": {
          "Content-Type": "\"application/json\"",
          "Authorization": "\"Bearer pat-na2-xxxxx\""
        }
      },
      { "name": "fieldPaths" },
      {
        "name": "removeNull",
        "formulaText": "true"
      },
      { "name": "returnResponseMetadata" },
      {
        "name": "followRedirects",
        "formulaText": "true"
      },
      { "name": "followRedirectsOptions|maxRedirects" },
      { "name": "responseTimeout" },
      {
        "name": "shouldRetry",
        "formulaText": "true"
      },
      { "name": "retryOptions|maxRetries" },
      { "name": "retryOptions|statusCodesToRetry" },
      { "name": "retryOptions|errorCodesToRetry" }
    ],
    "customRateLimitRules": {
      "timeWindow": [
        { "limit": 5, "bucket": ["WORKSPACE_ID"], "durationMs": 1000 }
      ]
    }
  }
}
```

### 5.2 HTTP Input Parameters

| Parameter | Required | Type | Description |
|---|---|---|---|
| `method` | Yes | formulaText | `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"` |
| `url` | Yes | formulaText | Full URL (can include column refs) |
| `body` | For POST/PUT/PATCH | formulaText | JSON string body (use `Clay.formatForJSON()` for dynamic values) |
| `headers` | Usually | formulaMap | Header key-value pairs |
| `removeNull` | Recommended | formulaText | `true` — strips null values from request |
| `followRedirects` | Recommended | formulaText | `true` |
| `shouldRetry` | Recommended | formulaText | `true` |

**Empty params to always include:** `queryString`, `fieldPaths`, `returnResponseMetadata`, `followRedirectsOptions|maxRedirects`, `responseTimeout`, `retryOptions|maxRetries`, `retryOptions|statusCodesToRetry`, `retryOptions|errorCodesToRetry`

### 5.3 Body Construction

Use `Clay.formatForJSON()` for all dynamic values inside JSON body strings:

```javascript
// Simple body
"\"{\\\"domain\\\": \\\"\" + Clay.formatForJSON({{@Company Domain}}) + \"\\\"}\""

// Complex body with nested structures
"\"{\\\"properties\\\":{\\\"firstname\\\":\\\"\" + Clay.formatForJSON({{@First Name}}) + \"\\\",\\\"lastname\\\":\\\"\" + Clay.formatForJSON({{@Last Name}}) + \"\\\",\\\"email\\\":\\\"\" + Clay.formatForJSON({{@Work Email}}) + \"\\\"},\\\"associations\\\":[{\\\"to\\\":{\\\"id\\\":\\\"\" + Clay.formatForJSON({{@Company ID}}) + \"\\\"},\\\"types\\\":[{\\\"associationCategory\\\":\\\"HUBSPOT_DEFINED\\\",\\\"associationTypeId\\\":1}]}]}\""
```

### 5.4 Dynamic Auth from Config Lookup

Instead of hardcoding API keys, use a Google Sheets config lookup:

```json
{
  "name": "headers",
  "formulaMap": {
    "Content-Type": "\"application/json\"",
    "Authorization": "\"Bearer \" + Clay.formatForJSON({{@Lookup Config}}?.[\"hubspot_token\"])"
  }
}
```

### 5.5 Common API Patterns

**HubSpot Search:**
```
POST https://api.hubapi.com/crm/v3/objects/{objectType}/search
```

**HubSpot Create:**
```
POST https://api.hubapi.com/crm/v3/objects/{objectType}
```

**HubSpot Update:**
```
PATCH https://api.hubapi.com/crm/v3/objects/{objectType}/{objectId}
```

**Apollo Search Contact:**
```
POST https://api.apollo.io/api/v1/contacts/search
Headers: accept, x-api-key, Content-Type, Cache-Control
```

**Apollo Create Contact:**
```
POST https://api.apollo.io/v1/contacts
Body: { api_key, first_name, last_name, organization, email, owner_id }
```

**GitHub Raw Config Fetch:**
```
GET https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/{branch}/{path}
```

**GoExtrovert Add Prospect:**
```
POST https://api.goextrovert.com/client/v1/prospects
Headers: x-api-key
```

---

## 6. Built-in Enrichment Actions

### 6.1 Enrich Company (MixRank)

```json
{
  "name": "Enrich Company",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "enrich-company-with-mixrank-v2",
    "actionVersion": 1,
    "actionPackageId": "e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2",
    "inputsBinding": [
      {
        "name": "company_identifier",
        "formulaText": "{{@Company Domain}}"
      }
    ]
  }
}
```

**Input:** `company_identifier` — domain name, LinkedIn org ID, or company name
**Output fields:** `name`, `website`, `domain`, `employee_count`, `url`, `org_id`, `founded`, `description`, `derived_datapoints.employee_count`, `size`

### 6.2 Enrich Person (MixRank)

```json
{
  "name": "Enrich Person",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "enrich-person-with-mixrank-v2",
    "actionVersion": 1,
    "actionPackageId": "e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2",
    "inputsBinding": [
      {
        "name": "person_identifier",
        "formulaText": "{{@Prospect Li URL}}"
      }
    ]
  }
}
```

**Input:** `person_identifier` — LinkedIn URL, email, or full name + company
**Output fields:** `first_name`, `last_name`, `title`, `current_title`, `slug`, `current_experience[].company_domain`, `current_experience[].start_date`, `current_experience[].org_id`, `experience[]`

### 6.3 Find Jobs (MixRank)

```json
{
  "name": "Find Jobs",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "find-lists-of-jobs-with-mixrank",
    "actionVersion": 1,
    "actionPackageId": "e251a70e-46d7-4f3a-b3ef-a211ad3d8bd2",
    "inputsBinding": [
      {
        "name": "company_identifier",
        "formulaText": "{{@Company Domain}}"
      }
    ]
  }
}
```

**Output fields:** `jobs[]` array with job listing details

---

## 7. Cross-Table Actions

### 7.1 Lookup Single Row

```json
{
  "name": "Lookup Company",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "lookup-row-in-other-table",
    "actionVersion": 1,
    "actionPackageId": "4299091f-3cd3-4d68-b198-0143575f471d",
    "inputsBinding": [
      {
        "name": "tableId",
        "formulaText": "\"t_xxxxxxxxxxxxxxxxxxxxx\""
      },
      {
        "name": "fields|targetColumn",
        "formulaText": "\"f_xxxxxxxxxxxxxxxxxxxxx\""
      },
      {
        "name": "fields|filterOperator",
        "formulaText": "\"EQUAL\""
      },
      {
        "name": "fields|rowValue",
        "formulaText": "{{@Company Domain}}"
      }
    ],
    "authAccountId": "aa_KfM2Ys6wyDfC"
  }
}
```

**Output:** `{ record: { "Column Name": value, ... } }`
**Access pattern:** `{{@Lookup Company}}?.record?.["Column Name"]`

**Note:** `tableId` and `fields|targetColumn` use internal Clay IDs. These must be obtained from the actual Clay table you're looking up against.

### 7.2 Lookup Multiple Rows

Same structure but with `lookup-multiple-rows-in-other-table`:

```json
{
  "name": "Find All Prospects",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "lookup-multiple-rows-in-other-table",
    "actionVersion": 1,
    "actionPackageId": "4299091f-3cd3-4d68-b198-0143575f471d",
    "inputsBinding": [
      {
        "name": "tableId",
        "formulaText": "\"t_xxxxxxxxxxxxxxxxxxxxx\""
      },
      {
        "name": "fields|targetColumn",
        "formulaText": "\"f_xxxxxxxxxxxxxxxxxxxxx\""
      },
      {
        "name": "fields|filterOperator",
        "formulaText": "\"EQUAL\""
      },
      {
        "name": "fields|rowValue",
        "formulaText": "{{@Org Id}}"
      }
    ],
    "authAccountId": "aa_KfM2Ys6wyDfC"
  }
}
```

**Output:** `{ records: [ { "Column Name": value, ... }, ... ] }`
**Access pattern:** `{{@Find All Prospects}}?.records?.map(r => r?.["Name"])` or `{{@Find All Prospects}}?.records?.[0]?.["Name"]`

### 7.3 Lookup Record (by Record ID)

```json
{
  "actionKey": "lookup-record-in-other-table",
  "actionPackageId": "4299091f-3cd3-4d68-b198-0143575f471d",
  "inputsBinding": [
    {
      "name": "tableId",
      "formulaText": "\"t_xxxxxxxxxxxxxxxxxxxxx\""
    },
    {
      "name": "recordId",
      "formulaText": "{{@Source Record ID}}"
    }
  ]
}
```

### 7.4 Route Row (Push to Another Table)

Sends data to another Clay table:

```json
{
  "name": "Push to Pipeline",
  "type": "action",
  "typeSettings": {
    "dataTypeSettings": { "type": "json" },
    "actionKey": "route-row",
    "actionVersion": 1,
    "actionPackageId": "b1ab3d5d-b0db-4b30-9251-3f32d8b103c1",
    "inputsBinding": [
      {
        "name": "tableId",
        "formulaText": "\"t_xxxxxxxxxxxxxxxxxxxxx\""
      },
      {
        "name": "fields",
        "formulaMap": {
          "full_name": "{{@Full Name}}",
          "job_title": "{{@Enrich Person}}?.current_title",
          "company_name": "{{@Enrich Company}}?.name",
          "company_domain": "{{@Company Domain}}"
        }
      }
    ]
  }
}
```

For passing nested JSON objects through route-row, use a separate `nestedData` map:

```json
{
  "name": "nestedData",
  "formulaMap": {
    "Enrich Company Data": "{{@Enrich Company}}",
    "AI Research Data": "{{@Company Research}}"
  }
}
```

---

## 8. Third-Party Integration Actions

### 8.1 Email Finders

All three follow the same pattern — only `actionKey` and `actionPackageId` differ:

**LeadMagic:**
```json
{
  "actionKey": "leadmagic-find-work-email",
  "actionPackageId": "edb58209-a62d-42be-992a-e41b87eeacc2",
  "inputsBinding": [
    { "name": "linkedin_url", "formulaText": "{{@Prospect Li URL}}" }
  ],
  "authAccountId": "aa_T8yKjAqm5Tcu"
}
```

**Prospeo:**
```json
{
  "actionKey": "prospeo-find-work-email-v2",
  "actionPackageId": "48a31bbb-63e6-4461-8a62-d88bb2cd6b0f",
  "inputsBinding": [
    { "name": "linkedin_url", "formulaText": "{{@Prospect Li URL}}" }
  ],
  "authAccountId": "aa_0sw9e8yWzEpacYFdJfH"
}
```

**FindyMail:**
```json
{
  "actionKey": "findymail-find-work-email",
  "actionPackageId": "9515bb04-4267-4074-94eb-653545c3c38f",
  "inputsBinding": [
    { "name": "linkedin_url", "formulaText": "{{@Prospect Li URL}}" }
  ],
  "authAccountId": "aa_6vklGXhaYDrB"
}
```

**Output:** `{ email: "user@company.com" }` — access via `{{@LeadMagic Email}}?.email`

### 8.2 HeyReach (LinkedIn Campaign)

```json
{
  "actionKey": "heyreach-add-lead-to-campaign",
  "actionPackageId": "38c1e626-7785-4d36-a993-301bd302aebf",
  "inputsBinding": [
    { "name": "campaignId", "formulaText": "\"294757\"" },
    { "name": "linkedinUrl", "formulaText": "{{@Prospect Li URL}}" },
    {
      "name": "customUserFields",
      "formulaMap": {
        "vmid": "{{@VMID}}",
        "org_id": "{{@Org Id}}",
        "hubspot_company_id": "{{@HubSpot Company ID}}",
        "hubspot_contact_id": "{{@Create HS Contact}}?.id"
      }
    }
  ],
  "authAccountId": "aa_0t6li3sjytiU4pgRKs4"
}
```

### 8.3 PhantomBuster Push Data

```json
{
  "actionKey": "phantombuster-push-data-v2",
  "actionPackageId": "3ac0ca43-ed34-4662-b69a-82a225f7a005",
  "inputsBinding": [
    { "name": "agentId", "formulaText": "\"1812792654925033\"" },
    { "name": "pbArguments|inputType", "formulaText": "\"salesNavigatorSearchUrl\"" },
    { "name": "pbArguments|salesNavigatorSearchUrl", "formulaText": "{{@Sales Nav URL}}" },
    { "name": "pbArguments|sessionCookie", "formulaText": "\"AQEDAx...\"" },
    { "name": "pbArguments|keywords" },
    { "name": "pbArguments|spreadsheetUrl" },
    { "name": "pbArguments|searches" },
    { "name": "pbArguments|spreadsheetColumnName" },
    { "name": "pbArguments|columnName" },
    { "name": "pbArguments|userAgent" },
    { "name": "pbArguments|numberOfResultsPerSearch" },
    { "name": "pbArguments|numberOfProfiles" },
    { "name": "pbArguments|numberOfLinesPerLaunch" },
    { "name": "pbArguments|removeDuplicateProfiles" },
    { "name": "pbArguments|watcherMode" },
    { "name": "pbArguments|accountSearch" },
    { "name": "pbArguments|chooseSecondTeam" },
    { "name": "pbArguments|csvName" },
    { "name": "pbArguments|filters" }
  ],
  "authAccountId": "aa_0t4fph87TvWGGMFTxJh"
}
```

### 8.4 Google Sheets — Add Row

```json
{
  "actionKey": "google-sheets-add-row-v2",
  "actionPackageId": "b52dbb55-6b36-4b63-9f8c-21d923353045",
  "inputsBinding": [
    { "name": "id", "formulaText": "\"1yerj2-fs6fLSBNoKev_fXTMY2zvN5bwy_P-tFYeWjn0\"" },
    { "name": "sheetId", "formulaText": "\"15875691\"" },
    { "name": "columnMapping|Full Name", "formulaText": "{{@Full Name}}" },
    { "name": "columnMapping|Job Title", "formulaText": "{{@Job Title}}" },
    { "name": "columnMapping|Company", "formulaText": "{{@Company Name}}" },
    { "name": "columnMapping|Li URL", "formulaText": "{{@Prospect Li URL}}" }
  ],
  "authAccountId": "aa_0t9iv44JsRr3mYDkoJX"
}
```

### 8.5 Google Sheets — Lookup Row

```json
{
  "actionKey": "google-sheets-lookup-row-v2",
  "actionPackageId": "b52dbb55-6b36-4b63-9f8c-21d923353045",
  "inputsBinding": [
    { "name": "id", "formulaText": "\"<spreadsheet_id>\"" },
    { "name": "lookupColumn", "formulaText": "\"ID\"" },
    { "name": "lookupValue", "formulaText": "\"config_row_1\"" },
    { "name": "returnFields", "formulaText": "\"hubspot_token,heyreach_campaign_id,target_region\"" }
  ],
  "authAccountId": "aa_0t9iv44JsRr3mYDkoJX"
}
```

**Output:** Flat object with column values: `{{@Lookup Config}}?.["hubspot_token"]`

### 8.6 Airtable — Lookup Field

```json
{
  "actionKey": "lookup-field",
  "actionPackageId": "c80f9425-497b-4a13-86a4-3edf0a093c2d",
  "inputsBinding": [
    { "name": "baseId", "formulaText": "\"appXXXXXXXXXXXXXX\"" },
    { "name": "tableId", "formulaText": "\"tblXXXXXXXXXXXXXX\"" },
    { "name": "fieldId", "formulaText": "\"fldXXXXXXXXXXXXXX\"" },
    { "name": "lookupValue", "formulaText": "{{@Source Column}}" }
  ],
  "authAccountId": "aa_0t9findeKzmmuzEuWJ2"
}
```

---

## 9. Formula Columns

### 9.1 Data Type Settings

| type | Example Output | iconType.displayName |
|---|---|---|
| `"text"` | `"Hello world"` | `"TextT"` |
| `"url"` | `"https://..."` | — |
| `"number"` | `42` | — |
| `"email"` | `"user@example.com"` | — |
| `"date"` | `"2026-02-22"` | `"Calendar"` |
| `"boolean"` | `true` / `false` | `"CheckSquare"` |

### 9.2 Property Extraction (mappedResultPath)

Extract a nested value from a parent column:

```json
{
  "name": "Employee Count",
  "type": "formula",
  "typeSettings": {
    "dataTypeSettings": { "type": "number" },
    "formulaType": "text",
    "formulaText": "{{@Enrich Company}}?.employee_count",
    "mappedResultPath": ["employee_count"]
  }
}
```

**Path levels:**
- 1-level: `["employee_count"]`, `["name"]`, `["email"]`, `["tier"]`
- 2-level: `["record", "Column Name"]`, `["analysis", "priorityTier"]`, `["executiveSummary", "workModel"]`
- 3-level: `["results", 0, "id"]` (with numeric array index)

### 9.3 Formula Language Reference

Clay formulas use JavaScript-like syntax with some Clay-specific features.

**Column References:**
```javascript
{{@Column Name}}                    // Reference another column's value
{{@Column Name}}?.property          // Optional chaining on properties
{{@Column Name}}?.["Spaced Key"]    // Bracket notation for special chars
{{@Column Name}}?.nested?.deep      // Deep optional chaining
```

**String Methods:**
```javascript
.toLowerCase()
.toUpperCase()
.includes("substring")
.startsWith("prefix")
.split(",")
.split(/[\s,]+/)            // Regex split
.trim()
.toString()
```

**Array Methods:**
```javascript
.map(item => item?.name)
.filter(item => item?.score > 0)
.find(item => item?.id === targetId)
.some(keyword => title?.includes(keyword))
.join(", ")
.slice(-1)
.concat(otherArray)
.length
```

**Ternary Expressions:**
```javascript
// Simple
condition ? "Yes" : "No"

// Chained (multi-branch)
{{@Score}} == 1 ? "High" : {{@Score}} == 2 ? "Medium" : "Low"

// Complex multi-line
{{@Location}}?.includes("California") ? "West Coast" :
{{@Location}}?.includes("New York") ? "East Coast" :
{{@Location}}?.includes("United States") ? "USA" : "International"
```

**Null Handling:**
```javascript
{{@Field}} || "default"                          // Fallback
(!{{@Field}} && "" || {{@Field}})?.toLowerCase() // Safe toLowerCase
({{@Field}} || "").toLowerCase()                 // Simpler safe version
```

**Keyword Matching:**
```javascript
["hr", "people", "benefits", "ceo", "founder"].some(k =>
  ({{@Job Title}} || "")?.toLowerCase()?.includes(k)
) ? "Qualified" : "DQ"
```

**Numeric Coercion:**
```javascript
+{{@Employee Count}}                  // Unary plus for coercion
parseFloat({{@Score}} || "0")         // parseFloat fallback
```

**Clay Helpers:**
```javascript
Clay.formatForAIPrompt(value)   // Safe for AI prompt injection
Clay.formatForJSON(value)       // Safe for JSON string injection
```

**Third-party Libraries Available:**
```javascript
// moment.js
moment().format("YYYY-MM-DD")
moment().diff(moment(startDate), "months")

// Lodash
_.chain(array).uniqBy("key").orderBy("score", "desc").value()
_.compact(array)

// JSON
JSON.stringify(object)
```

**Common Formula Patterns:**

```javascript
// URL validation
{{@URL}}?.toLowerCase()?.startsWith("https://www.linkedin.com/in/") ? "Yes" : "No"

// VMID extraction from LinkedIn URL
{{@URL}}?.split("/in/")?.[1]?.split(/[/?#]/)?.[0] || "No VMID"

// Email waterfall (pick first non-null)
{{@LeadMagic}}?.email || {{@FindyMail}}?.email || {{@Prospeo}}?.email || ""

// HubSpot result interpretation
!{{@HubSpot Search}} ? "" :
  {{@HubSpot Search}}?.total === 0 ? "No company found" :
  {{@HubSpot Search}}?.total > 0 ? "Company exists" : ""

// Multi-condition status
{{@Tier}} && {{@Work Email}} && {{@HubSpot Contact}} ? "Ready" :
{{@Tier}} && !{{@Work Email}} ? "Missing Email" :
!{{@Tier}} ? "Not Scored" : "Pending"

// Array.includes for tier gating
["1", "2"].includes({{@Tier}})

// Today's date
moment().format("YYYY-MM-DD")

// Array-to-string joining
({{@Multi Row Lookup}}?.records || [])?.map(r => r?.["Name"])?.join(", ")

// Priority score extraction from pipe-delimited string
({{@Priority Rank}} || "").split(",").map(s => s.trim()).map(p => p.split("|"))
  .find(a => (a?.[1] || "").toLowerCase() === ({{@vmid}} || "").toLowerCase())?.[0] || ""
```

---

## 10. Input Binding System

### 10.1 Simple formulaText

A single JavaScript expression that evaluates to a value:

```json
{ "name": "paramName", "formulaText": "\"literal string\"" }
{ "name": "paramName", "formulaText": "{{@Column Name}}" }
{ "name": "paramName", "formulaText": "{{@Column}}?.property" }
{ "name": "paramName", "formulaText": "true" }
{ "name": "paramName", "formulaText": "3" }
```

### 10.2 formulaMap (Object Values)

For parameters that accept object inputs:

```json
{
  "name": "paramName",
  "formulaMap": {
    "key1": "\"literal\"",
    "key2": "{{@Column}}?.property",
    "key3": "{{@Column}}"
  }
}
```

Each value in the map is a formulaText expression (same syntax as simple formulaText).

### 10.3 Pipe Notation (Nested Parameters)

For parameters with hierarchical structure, use `|` as separator:

```json
{ "name": "fields|targetColumn", "formulaText": "\"f_xxx\"" }
{ "name": "fields|filterOperator", "formulaText": "\"EQUAL\"" }
{ "name": "fields|rowValue", "formulaText": "{{@Domain}}" }
{ "name": "columnMapping|Full Name", "formulaText": "{{@Name}}" }
{ "name": "pbArguments|inputType", "formulaText": "\"salesNavigatorSearchUrl\"" }
{ "name": "retryOptions|maxRetries" }
{ "name": "followRedirectsOptions|maxRedirects" }
```

### 10.4 Empty Declarations

Parameters with no value — include them with just the name:

```json
{ "name": "temperature" }
{ "name": "queryString" }
```

**Rule:** Always include ALL parameters for an action type, even if empty. This matches Clay's internal schema expectations.

---

## 11. Conditional Run Formulas

The `conditionalRunFormulaText` field controls whether an action executes. It must evaluate to a truthy value for the action to run.

### 11.1 Pattern Catalog

**Truthiness (field exists and is non-empty):**
```javascript
{{@Field Name}}
!!{{@Field Name}}
{{@Field A}} && {{@Field B}}
```

**Equality:**
```javascript
{{@Valid?}} == "Yes"
{{@Status}} == "Company found in HS"
({{@Field}} || "").toLowerCase() == "qualified"
```

**Inequality / Negation:**
```javascript
!{{@Previous Step}}                                    // Run if previous step returned nothing (fallback)
!{{@LeadMagic}} && !{{@Prospeo}}                       // Double fallback
{{@VMID}}?.toLowerCase() !== "no vmid"                 // Exclude error values
```

**String method checks:**
```javascript
{{@Tier}}?.toLowerCase()?.includes("tier")
({{@Field}} || "").toLowerCase().startsWith("https://")
```

**Array membership:**
```javascript
["1", "2"].includes({{@Tier}})
["tier 1", "tier 2"].includes(({{@Tier}} || "").toLowerCase())
["p1", "p2"].includes(({{@Priority}} || "").toLowerCase())
[1].includes(+({{@Score}} || ""))                      // Numeric with coercion
```

**Numeric comparison:**
```javascript
+{{@Count}} >= 50 && +{{@Count}} <= 500
parseFloat({{@Employees}} || "") > 50
```

**Regex:**
```javascript
/^(1|2|3|4|5)$/.test(String({{@Prospect #}} || ""))
```

**Nested property checks:**
```javascript
!({{@Internet Signals}}?.signals?.length)              // Empty array = skip
!!({{@P1 Contacts}}?.records?.length || {{@P2 Contacts}}?.records?.length)
```

**HubSpot null-safe pattern:**
```javascript
(!{{@HS Search}} ? "" : {{@HS Search}}?.total) === 0  // Company doesn't exist
```

**Compound conditions:**
```javascript
{{@Valid?}} == "Yes" && !!{{@Company Domain}}
{{@Enrich Company}} && ["1", "2"].includes({{@Tier}})
{{@Contact ID}} && {{@Apollo Update}} && {{@Apollo Owner}}
```

---

## 12. Rate Limit Configurations

### 12.1 Standard Configurations

**For AI actions (Gemini/Claude, 5 req/s):**
```json
{
  "timeWindow": [
    { "limit": 5, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ]
}
```

**For AI actions (GPT-4.1-nano, higher throughput):**
```json
{
  "timeWindow": [
    { "limit": 17, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ]
}
```

**For AI actions (GPT-5/GPT-5-mini, high throughput):**
```json
{
  "timeWindow": [
    { "limit": 75, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ]
}
```

**For AI actions (GPT-5-mini/GPT-4.1-nano max throughput):**
```json
{
  "timeWindow": [
    { "limit": 200, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ]
}
```

**For Grok actions (8 req/s):**
```json
{
  "timeWindow": [
    { "limit": 8, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ]
}
```

**For Claygent with clay-argon (workspace-level):**
```json
{
  "timeWindow": [
    { "limit": 40, "bucket": ["WORKSPACE_ID"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ]
}
```

**For HubSpot/external API actions:**
```json
{
  "timeWindow": [
    { "limit": 5, "bucket": ["WORKSPACE_ID"], "durationMs": 1000 }
  ]
}
```

**For Claude Opus (with concurrency cap):**
```json
{
  "timeWindow": [
    { "limit": 5, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 750, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ],
  "concurrency": [
    { "limit": 60, "bucket": ["PRIVATE_AUTH_KEY"] }
  ]
}
```

**For Claude Sonnet (with higher concurrency):**
```json
{
  "timeWindow": [
    { "limit": 28, "bucket": ["PRIVATE_AUTH_KEY", "CUSTOM_KEY"], "durationMs": 1000 },
    { "limit": 1000, "bucket": ["GLOBAL"], "durationMs": 1000 }
  ],
  "concurrency": [
    { "limit": 60, "bucket": ["PRIVATE_AUTH_KEY"] }
  ]
}
```

### 12.2 Rate Limit Bucket Types

| Bucket | Scope |
|---|---|
| `PRIVATE_AUTH_KEY` | Per-user API key |
| `CUSTOM_KEY` | Per-custom integration key |
| `GLOBAL` | Platform-wide Clay limit |
| `WORKSPACE_ID` | Per-Clay workspace |

### 12.3 Model → Rate Limit Mapping

| Model | Per-key limit | Global limit | Concurrency |
|---|---|---|---|
| `gpt-4.1-nano` | 17-200 | 750 | — |
| `gpt-5-mini` | 200 | 750 | — |
| `gpt-5` | 75 | 750 | — |
| `gemini-2.5-flash` | 5 | 750 | — |
| `gemini-2.5-pro` | 5 | 750 | — |
| `gemini-3-pro` | 5 | 750 | — |
| `grok-4` | 8 | 750 | — |
| `grok-4-1-fast-reasoning` | 8 | 750 | — |
| `clay-argon` | 40 (WORKSPACE_ID) | 750 | — |
| `claude-sonnet-4-5` | 28 | 1000 | 60 |
| `claude-sonnet-4-6` | 28 | 1000 | 60 |
| `claude-opus-4` | 5 | 750 | 60 |
| `deepseek-v3.2` | 8 | 1000 | 60 |

---

## 13. Common Multi-Column Patterns

### 13.1 Email Waterfall

Run 3 email finders with conditional fallback, then pick the first result:

```
Column 5: LeadMagic Find Email (action)
  - conditionalRun: (none, or tier gate)

Column 6: Prospeo Find Email (action)
  - conditionalRun: !{{@LeadMagic Find Email}}

Column 7: FindyMail Find Email (action)
  - conditionalRun: !{{@LeadMagic Find Email}} && !{{@Prospeo Find Email}}

Column 8: Work Email (formula)
  - formulaText: {{@LeadMagic Find Email}}?.email || {{@Prospeo Find Email}}?.email || {{@FindyMail Find Email}}?.email || ""
```

### 13.2 HubSpot Check → Create Pattern

Search for existing record, create if not found:

```
Column A: Search HubSpot (http-api-v2, POST search)
Column B: HubSpot Status (formula)
  - formulaText: !{{@Search HubSpot}} ? "" : {{@Search HubSpot}}?.total === 0 ? "Not found" : "Exists"
Column C: HubSpot ID (formula)
  - formulaText: {{@Search HubSpot}}?.results?.[0]?.id
  - mappedResultPath: ["results", 0, "id"]
Column D: Create in HubSpot (http-api-v2, POST create)
  - conditionalRun: {{@HubSpot Status}} == "Not found"
Column E: Final HubSpot ID (formula)
  - formulaText: {{@Search HubSpot}}?.results?.[0]?.id || {{@Create in HubSpot}}?.id
```

### 13.3 Enrichment → Extraction Pattern

Run enrichment, then extract individual fields:

```
Column A: Enrich Company (action)
Column B: Company Name (formula) — {{@Enrich Company}}?.name, mappedResultPath: ["name"]
Column C: Employee Count (formula) — {{@Enrich Company}}?.employee_count, mappedResultPath: ["employee_count"]
Column D: Domain (formula) — {{@Enrich Company}}?.domain, mappedResultPath: ["domain"]
```

### 13.4 AI Chain Pattern

Multi-step AI analysis where each step builds on previous:

```
Column A: Research (claygent) — web research
Column B: Analysis (use-ai) — analyze research output
Column C: Score (use-ai) — score based on analysis
Column D: Tier (formula) — extract tier from score: {{@Score}}?.tier
```

### 13.5 Webhook → Validate → Process Pattern

Standard table start:

```
Column 0: Webhook (source)
Column 1: Prospect URL (formula) — extract from webhook: {{@Webhook}}?.["prospect_li_url"]
Column 2: Company Domain (formula) — extract from webhook: {{@Webhook}}?.["company_domain"]
Column 3: Valid Profile? (formula) — validate URL format
Column 4+: Processing actions (with conditionalRun on Valid Profile?)
```

### 13.6 Cross-Table Pipeline (P1 → P2)

Table P1 processes initial data, then triggers Table P2 via HTTP callback:

```
// In P1: Send to external processor with P2's webhook as callback
Column X: Process External (http-api-v2)
  - body includes: "callback_webhook": "https://api.clay.com/v3/sources/webhook/..."

// In P2: Receive callback, lookup P1 data
Column 0: Webhook (source) — receives callback
Column 1: Lookup P1 (lookup-row-in-other-table) — fetch original row from P1
Column 2+: Combine P1 data with callback data for further processing
```

### 13.7 Config-Driven Pipeline

Fetch configuration from external source (Google Sheets or GitHub), use throughout:

```
Column 1: Lookup Config (google-sheets-lookup-row-v2)
  - lookupValue: "config_row_1"
  - returnFields: "hubspot_token,campaign_id,target_region"

Column N: HubSpot Search (http-api-v2)
  - headers: Authorization uses {{@Lookup Config}}?.["hubspot_token"]

Column M: HeyReach (heyreach-add-lead-to-campaign)
  - campaignId: {{@Lookup Config}}?.["campaign_id"]
```

---

## 14. Auth Account Reference

Auth accounts are workspace-specific. These are the known accounts from production tables:

| authAccountId | Service | Notes |
|---|---|---|
| `aa_FfAwz41BuzME` | Google AI (Gemini) | Claygent mode |
| `aa_0t6ag73mPirNqpgrotf` | Google AI (Gemini) | Use-ai mode |
| `aa_0t3rf2hsVda3cBShEr6` | OpenAI (GPT) | Nano/cheap calls |
| `aa_D5TnW9yPFfQx` | Claude (Anthropic) | Sonnet/Opus |
| `aa_0tachtr7MgX9QoKWWme` | Grok (xAI) | Fast reasoning |
| `aa_0svqk6cbifNxyobXCrw` | DeepSeek | v3.2 |
| `aa_0t42p8jtDzZuwahMCpo` | Google AI | HS property adjustment |
| `aa_0taaiu6eeucRiNV6fRY` | Google AI | Contact creation AI |
| `aa_KfM2Ys6wyDfC` | Clay | Table lookups |
| `aa_T8yKjAqm5Tcu` | LeadMagic | Email finder |
| `aa_0sw9e8yWzEpacYFdJfH` | Prospeo | Email finder |
| `aa_6vklGXhaYDrB` | FindyMail | Email finder |
| `aa_0t6li3sjytiU4pgRKs4` | HeyReach | Campaign management |
| `aa_0t9iv44JsRr3mYDkoJX` | Google | Sheets API |
| `aa_0t4fph87TvWGGMFTxJh` | PhantomBuster | Agent #1 |
| `aa_0sxl8ssUc6kvHa4WiGG` | PhantomBuster | Agent #2 |
| `aa_0t9findeKzmmuzEuWJ2` | Airtable | Field lookup |
| `aa_0t96a5yC8EbjPzmoAoy` | HTTP | GitHub raw fetch |

**Important:** Auth account IDs are workspace-specific. When building tables for a different workspace, the user must provide the correct auth account IDs. HTTP API actions that pass auth in headers (like HubSpot Bearer tokens) do NOT use `authAccountId`.

---

## 15. Validation Rules & Gotchas

### 15.1 Schema Structure Rules

1. **`columnCount` must match `columns.length`** — mismatch will cause import failure
2. **`index` must be sequential starting from 0** — gaps or duplicates will fail
3. **Column names must be unique** — duplicate names cause reference ambiguity
4. **`actionVersion` is always `1`** — no other values observed
5. **`version` is always `"1.0"`** — the only supported schema version

### 15.2 Formula Rules

1. **`formulaType` is always `"text"`** — even for number, boolean, or date outputs
2. **All formulas evaluate as JavaScript expressions** — they must return a single value
3. **Use `?.` (optional chaining) everywhere** — Clay data can be null at any point
4. **String literals in formulas use escaped quotes** — `\"text\"` not `'text'`
5. **Array indices use string bracket notation** — `?.["0"]` not `?.[0]` in some contexts (though both work)

### 15.3 Action Rules

1. **`dataTypeSettings.type` is always `"json"` for actions** — even if the action returns text
2. **Include ALL input parameters** — even empty ones with just `{ "name": "paramName" }`
3. **AI actions MUST have `_metadata`** — always include `{ "name": "_metadata", "formulaMap": { "modelSource": "user" } }`
4. **`authAccountId` is required for AI actions** — without it, Clay won't know which API key to use
5. **`authAccountId` is NOT used for HTTP API actions** — auth goes in headers instead
6. **`conditionalRunFormulaText` references must exist** — referencing a non-existent column will cause errors

### 15.4 JSON Schema Rules (for AI answerSchemaType)

1. **Double-escape the schema string** — the jsonSchema value is a JSON string containing a JSON string
2. **Always set `"additionalProperties": false`** — at every object level
3. **Always set `"required"` array** — list all required property names
4. **Use `"enum"` for constrained values** — Clay enforces enum constraints in AI output
5. **Nullable fields use `"type": ["string", "null"]`** — not `"nullable": true`

### 15.5 Common Mistakes

1. **Forgetting `?.` before property access** — `{{@Column}}.property` will throw if Column is null
2. **Not wrapping dynamic values in Clay helpers** — use `Clay.formatForJSON()` in HTTP bodies, `Clay.formatForAIPrompt()` in prompts
3. **Wrong escaping in body strings** — HTTP body is a JSON string inside a JSON string, requiring double escaping
4. **Missing empty input declarations** — Clay expects the full set of inputs for each action type
5. **Using `{{f_xxx}}` instead of `{{@Column Name}}`** — exported schemas must use portable name references
6. **Hardcoding API keys that should be dynamic** — use Google Sheets config lookup pattern for environment-specific values

### 15.6 Delay Settings

For actions that need spacing (e.g., web scraping that might rate-limit):

```json
"delaySettings": {
  "type": "delay-seconds",
  "delayFormulaText": "15"
}
```

Common values: `"15"`, `"30"`, `"60"` seconds. Applied at the action level in `typeSettings`.

### 15.7 runAsButton

To make an action manual-trigger instead of automatic:

```json
"runAsButton": true
```

Add this to `typeSettings` at the same level as `actionKey`. Used for destructive operations (HubSpot creates, campaign enrollment) that should require human confirmation.

---

## Appendix A: Building a Table Step by Step

1. **Start with the source** — webhook, trigger, or manual
2. **Extract fields from source** — formula columns pulling data from `{{@Webhook}}?.["field"]`
3. **Validate inputs** — formula columns checking URL format, required fields
4. **Enrich** — company/person enrichment actions with `conditionalRunFormulaText` on validation
5. **Extract enrichment data** — formula columns pulling specific fields from enrichment JSON
6. **AI analysis** — claygent for web research, use-ai for scoring/classification
7. **Extract AI results** — formula columns with `mappedResultPath`
8. **External integrations** — HubSpot search/create, email finders, campaign enrollment
9. **Status formulas** — final columns summarizing pipeline state

**Key principle:** Each column can only reference columns that come BEFORE it (lower index). Plan your column order accordingly — dependencies flow left to right.

---

## Appendix B: JSON Schema Escaping Helper

To create the `jsonSchema` value for `answerSchemaType`, take a JSON Schema object:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string", "description": "Full name" },
    "score": { "type": "integer", "description": "Score 1-10" },
    "tier": { "type": "string", "enum": ["1", "2", "DQ"] }
  },
  "required": ["name", "score", "tier"],
  "additionalProperties": false
}
```

Then double-escape it:
1. `JSON.stringify()` the schema → produces a string with `\"` escapes
2. Wrap in outer quotes and escape again → `\\\"`
3. The final value starts and ends with `\"`

The resulting `jsonSchema` value in the formulaMap:
```
"\"{\\n  \\\"type\\\": \\\"object\\\",\\n  \\\"properties\\\": {\\n    \\\"name\\\": {\\n      \\\"type\\\": \\\"string\\\",\\n      \\\"description\\\": \\\"Full name\\\"\\n    },\\n    \\\"score\\\": {\\n      \\\"type\\\": \\\"integer\\\",\\n      \\\"description\\\": \\\"Score 1-10\\\"\\n    },\\n    \\\"tier\\\": {\\n      \\\"type\\\": \\\"string\\\",\\n      \\\"enum\\\": [\\n        \\\"1\\\",\\n        \\\"2\\\",\\n        \\\"DQ\\\"\\n      ]\\n    }\\n  },\\n  \\\"required\\\": [\\n    \\\"name\\\",\\n    \\\"score\\\",\\n    \\\"tier\\\"\\n  ],\\n  \\\"additionalProperties\\\": false\\n}\""
```

**Tip:** The outer `"` and inner `\"` create the string-in-a-string structure that Clay expects.

---

## Appendix C: Reference Tables (Production)

These files in `clay/` are real production table exports that serve as examples:

| File | Columns | Description |
|---|---|---|
| `influencer-monitoring-p1.json` | 31 | LinkedIn engagement processing, HubSpot check/create, P2 trigger |
| `influencer-monitoring-p2.json` | 31 | Company enrichment, AI research chain, HubSpot company create |
| `patrycja-engagement-1.json` | 26 | Engagement pipeline P1 (similar to influencer-monitoring-p1) |
| `patrycja-engagement-2.json` | 28 | Engagement pipeline P2 (similar to influencer-monitoring-p2) |
| `clay-schema-t_0talpj7wmjwt8yZQXKn` | 60 | LinkedIn Personalization Engine (5-step AI chain, Airtable, HeyReach) |
| `clay-schema-t_0t9txjsQ347SNDmDtMW` | 15 | Company input/seed table (manual + AI fill) |
| `clay-schema-t_0t9txkpErpgj8XWeGzR` | 46 | Company qualification pipeline (13-step, route-row, GitHub config) |
| `clay-schema-t_0t6c1ekQpKB9i599BQ4` | 8 | PhantomBuster launcher (multi-row lookup, Sales Nav URL) |
| `clay-schema-t_0t6c2jgNU9FKGM6UYbw` | 36 | Prospect scoring & HubSpot push |
| `clay-schema-t_0t6c1idexEaVEHC22iS` | 7 | Company-level key contact selector |
| `clay-schema-t_0t942n5RtAkgm2hrwt9` | 26 | Company research & segmentation (Lodash, clay-argon) |
| `clay-schema-t_0t942nnZA5FmmekGtJQ` | 34 | New hire trigger campaign (email waterfall, Apollo lifecycle) |
| `clay-schema-t_0t942meiEkN9StCRFZJ` | 52 | Prospect enrichment & multi-channel outreach |
| `test-table-v1.json` | 10 | Test table (basic, validated import) |
| `test-table-v2.json` | 30 | Test table (comprehensive, 17 action types, validated import) |
