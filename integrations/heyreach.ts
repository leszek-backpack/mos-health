const HEYREACH_BASE = "https://api.heyreach.io/api/public";

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(method: string, url: string, extra?: Record<string, unknown>) {
  const masked = url.replace(/api_key=[^&]+/gi, "api_key=***");
  console.log(`[HeyReach] ${method} ${masked}`, extra ? JSON.stringify(extra) : "");
}

function logError(method: string, url: string, error: unknown) {
  const masked = url.replace(/api_key=[^&]+/gi, "api_key=***");
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[HeyReach] FAILED ${method} ${masked}: ${msg}`);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HeyReachCampaignStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "PAUSED"
  | "FINISHED"
  | "CANCELED"
  | "FAILED"
  | "STARTING"
  | "SCHEDULED";

export interface HeyReachCampaign {
  id: number;
  name: string;
  status: HeyReachCampaignStatus | string;
  creationTime?: string;
  startedAt?: string;
}

export interface HeyReachLinkedInAccountRaw {
  id: number;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  isActive?: boolean;
  activeCampaigns?: number;
  profileUrl?: string;
}

export interface HeyReachLinkedInAccount {
  id: number;
  name: string;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Conversations types
// ---------------------------------------------------------------------------

export interface HeyReachCorrespondentProfile {
  linkedin_id?: string;
  profileUrl?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  imageUrl?: string;
  location?: string;
  companyName?: string;
  position?: string;
}

export interface HeyReachConversationRaw {
  id: string;
  read?: boolean;
  groupChat?: boolean;
  lastMessageAt?: string;
  lastMessageText?: string;
  lastMessageSender?: string;
  totalMessages?: number;
  linkedInAccountId: number;
  correspondentProfile?: HeyReachCorrespondentProfile;
  messages: HeyReachMessageRaw[];
}

export interface HeyReachMessageRaw {
  createdAt?: string;
  body?: string;
  subject?: string;
  isInMail?: boolean;
  sender?: string; // "ME" | lead name
}

export interface HeyReachConversationsResponse {
  totalCount: number;
  items: HeyReachConversationRaw[];
}

// ---------------------------------------------------------------------------
// Overall Stats types
// ---------------------------------------------------------------------------

export interface HeyReachOverallStats {
  profileViews: number;
  postLikes: number;
  follows: number;
  messagesSent: number;
  totalMessageStarted: number;
  totalMessageReplies: number;
  connectionsSent: number;
  connectionsAccepted: number;
  messageReplyRate: number;
  connectionAcceptanceRate: number;
  inmailMessagesSent?: number;
  inmailReplies?: number;
}

export interface HeyReachOverallStatsResponse {
  overallStats: HeyReachOverallStats;
  byDayStats: Record<string, HeyReachOverallStats>;
}

export interface HeyReachLeadPayload {
  profileUrl: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
  companyName?: string;
  customUserFields?: Array<{ name: string; value: string }>;
}

export interface HeyReachAccountLeadPair {
  linkedInAccountId?: number | null;
  lead: HeyReachLeadPayload;
}

export interface AddLeadsResult {
  addedCount: number;
  updatedCount: number;
  failedCount: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolve API key — uses provided key, falls back to env var. */
function resolveApiKey(key?: string): string {
  const resolved = key || process.env.HEYREACH_API_KEY;
  if (!resolved) throw new Error("HeyReach API key is required");
  return resolved;
}

function headers(apiKey: string): Record<string, string> {
  return {
    "X-API-KEY": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function handleResponse<T>(response: Response, label?: string): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    const msg = `HeyReach API error ${response.status}: ${text}`;
    console.error(`[HeyReach] ${label ?? "request"} → ${msg}`);
    throw new Error(msg);
  }
  const json = await response.json();
  if (json.success === false) {
    const msg = `HeyReach error: ${json.message ?? "Unknown error"}`;
    console.error(`[HeyReach] ${label ?? "request"} → ${msg}`);
    throw new Error(msg);
  }
  console.log(`[HeyReach] ${label ?? "request"} raw keys:`, Object.keys(json));
  if (json.items !== undefined) return json.items as T;
  if (json.data !== undefined) return json.data as T;
  return json as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/** Verify the API key is valid. Returns true on 200 OK. Times out after 10s. */
export async function checkApiKey(apiKey: string): Promise<boolean> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/auth/CheckApiKey`;
  log("GET", url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers(key),
      signal: controller.signal,
    });
    clearTimeout(timer);
    log("GET", url, { status: response.status, ok: response.ok });
    return response.ok;
  } catch (err) {
    clearTimeout(timer);
    logError("GET", url, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

/** List all campaigns with optional pagination and filters. */
export async function getAllCampaigns(
  apiKey: string,
  params: { offset?: number; limit?: number } = {}
): Promise<HeyReachCampaign[]> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/campaign/GetAll`;
  log("POST", url);
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      offset: params.offset ?? 0,
      limit: Math.min(params.limit ?? 100, 100),
      statuses: [],
      accountIds: [],
      keyword: "",
    }),
  });
  return handleResponse<HeyReachCampaign[]>(response, "GetAll campaigns");
}

/** Get full details for a single campaign by ID. */
export async function getCampaignById(
  apiKey: string,
  campaignId: number
): Promise<HeyReachCampaign> {
  const key = resolveApiKey(apiKey);
  const response = await fetch(
    `${HEYREACH_BASE}/campaign/GetById?campaignId=${campaignId}`,
    { method: "GET", headers: headers(key) }
  );
  return handleResponse<HeyReachCampaign>(response);
}

/** Pause a campaign. */
export async function pauseCampaign(
  apiKey: string,
  campaignId: number
): Promise<HeyReachCampaign> {
  const key = resolveApiKey(apiKey);
  const response = await fetch(
    `${HEYREACH_BASE}/campaign/Pause?campaignId=${campaignId}`,
    { method: "POST", headers: headers(key), body: JSON.stringify({}) }
  );
  return handleResponse<HeyReachCampaign>(response);
}

/** Resume a paused campaign. */
export async function resumeCampaign(
  apiKey: string,
  campaignId: number
): Promise<HeyReachCampaign> {
  const key = resolveApiKey(apiKey);
  const response = await fetch(
    `${HEYREACH_BASE}/campaign/Resume?campaignId=${campaignId}`,
    { method: "POST", headers: headers(key), body: JSON.stringify({}) }
  );
  return handleResponse<HeyReachCampaign>(response);
}

// ---------------------------------------------------------------------------
// LinkedIn Accounts
// ---------------------------------------------------------------------------

/** List LinkedIn accounts connected to the HeyReach workspace. */
export async function getLinkedInAccounts(
  apiKey: string,
  params: { offset?: number; limit?: number; keyword?: string } = {}
): Promise<HeyReachLinkedInAccount[]> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/li_account/GetAll`;
  log("POST", url);
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      offset: params.offset ?? 0,
      limit: Math.min(params.limit ?? 100, 100),
      keyword: params.keyword ?? "",
    }),
  });
  const raw = await handleResponse<HeyReachLinkedInAccountRaw[]>(response, "GetAll LinkedIn accounts");
  log("POST", url, { count: raw.length });
  return raw.map((r) => ({
    id: r.id,
    name: [r.firstName, r.lastName].filter(Boolean).join(" ") || r.emailAddress || `Account ${r.id}`,
    isActive: r.isActive,
  }));
}

// ---------------------------------------------------------------------------
// Leads (V2 — correct payload format)
// ---------------------------------------------------------------------------

const MAX_LEADS_PER_BATCH = 100;

/**
 * Add leads to a campaign using the V2 endpoint with accountLeadPairs format.
 * Auto-batches in chunks of 100 (API limit).
 */
export async function addLeadsToCampaignV2(
  apiKey: string,
  campaignId: number,
  accountLeadPairs: HeyReachAccountLeadPair[]
): Promise<AddLeadsResult> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/campaign/AddLeadsToCampaignV2`;
  let totalAdded = 0;
  let totalUpdated = 0;
  let totalFailed = 0;

  for (let i = 0; i < accountLeadPairs.length; i += MAX_LEADS_PER_BATCH) {
    const batch = accountLeadPairs.slice(i, i + MAX_LEADS_PER_BATCH);
    log("POST", url, { campaignId, batchSize: batch.length, firstLead: batch[0]?.lead?.profileUrl });
    const response = await fetch(url, {
      method: "POST",
      headers: headers(key),
      body: JSON.stringify({ campaignId, accountLeadPairs: batch }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      logError("POST", url, new Error(`${response.status}: ${text}`));
      // Try to extract errorMessage from JSON response body
      let message = `HeyReach API error ${response.status}: ${text}`;
      try {
        const json = JSON.parse(text);
        if (json.errorMessage) message = json.errorMessage;
      } catch {
        // not JSON, use raw text
      }
      throw new Error(message);
    }
    // API returns { addedLeadsCount, updatedLeadsCount, failedLeadsCount }
    const json = await response.json();
    log("POST", url, {
      addedLeadsCount: json.addedLeadsCount,
      updatedLeadsCount: json.updatedLeadsCount,
      failedLeadsCount: json.failedLeadsCount,
    });
    totalAdded += json.addedLeadsCount ?? 0;
    totalUpdated += json.updatedLeadsCount ?? 0;
    totalFailed += json.failedLeadsCount ?? 0;
  }

  return { addedCount: totalAdded, updatedCount: totalUpdated, failedCount: totalFailed };
}

/**
 * Extract LinkedIn account IDs from all campaigns.
 * Fallback for when li_account/GetAll returns empty (API permission issue).
 */
export async function getLinkedInAccountIdsFromCampaigns(
  apiKey: string
): Promise<number[]> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/campaign/GetAll`;
  log("POST", url, { purpose: "extract LinkedIn account IDs from campaigns" });
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ offset: 0, limit: 100, statuses: [], accountIds: [], keyword: "" }),
  });
  if (!response.ok) {
    logError("POST", url, new Error(`${response.status}`));
    return [];
  }
  const json = await response.json();
  const campaigns = json.items ?? json.data ?? json;
  if (!Array.isArray(campaigns)) return [];

  const ids = new Set<number>();
  for (const c of campaigns) {
    if (Array.isArray(c.campaignAccountIds)) {
      for (const id of c.campaignAccountIds) ids.add(id);
    }
  }
  const result = [...ids];
  log("POST", url, { extractedLinkedInAccountIds: result });
  return result;
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

/**
 * Fetch conversations via GetConversationsV2.
 * Returns { totalCount, items } — items include full messages[] inline.
 */
export async function getConversationsV2(
  apiKey: string,
  linkedInAccountIds: number[],
  params: { offset?: number; limit?: number; searchString?: string } = {}
): Promise<HeyReachConversationsResponse> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/inbox/GetConversationsV2`;
  const offset = params.offset ?? 0;
  const limit = Math.min(params.limit ?? 100, 100);
  log("POST", url, { linkedInAccountIds, offset, limit });
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      linkedInAccountIds,
      offset,
      limit,
      searchString: params.searchString ?? "",
      campaignIds: [],
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    logError("POST", url, new Error(`${response.status}: ${text}`));
    throw new Error(`HeyReach API error ${response.status}: ${text}`);
  }
  const json = await response.json();
  const result = {
    totalCount: json.totalCount ?? 0,
    items: (json.items ?? []) as HeyReachConversationRaw[],
  };
  log("POST", url, { totalCount: result.totalCount, itemsReturned: result.items.length });
  return result;
}

/**
 * Send a message in a HeyReach conversation.
 */
export async function sendMessage(
  apiKey: string,
  linkedInAccountId: number,
  conversationId: string,
  message: string
): Promise<void> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/inbox/SendMessage`;
  log("POST", url, { linkedInAccountId, conversationId, messageLength: message.length });
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      linkedInAccountId,
      listConversationId: conversationId,
      message,
    }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    logError("POST", url, new Error(`${response.status}: ${text}`));
    throw new Error(`HeyReach API error ${response.status}: ${text}`);
  }
  log("POST", url, { status: response.status });
}

// ---------------------------------------------------------------------------
// Overall Stats (Reporting)
// ---------------------------------------------------------------------------

/**
 * Fetch overall stats from HeyReach with optional filtering.
 * Does NOT use handleResponse() — response shape differs (nested overallStats/byDayStats).
 */
export async function getOverallStats(
  apiKey: string,
  params: {
    accountIds?: number[];
    campaignIds?: number[];
    startDate?: string | null;
    endDate?: string | null;
  } = {}
): Promise<HeyReachOverallStatsResponse> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/stats/GetOverallStats`;
  log("POST", url, {
    accountIds: params.accountIds?.length ?? 0,
    campaignIds: params.campaignIds?.length ?? 0,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers(key),
      body: JSON.stringify({
        accountIds: params.accountIds ?? [],
        campaignIds: params.campaignIds ?? [],
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      logError("POST", url, new Error(`${response.status}: ${text}`));
      throw new Error(`HeyReach API error ${response.status}: ${text}`);
    }
    const json = await response.json();
    log("POST", url, {
      hasOverallStats: !!json.overallStats,
      byDayStatsCount: json.byDayStats ? Object.keys(json.byDayStats).length : 0,
    });
    return {
      overallStats: json.overallStats ?? {
        profileViews: 0,
        postLikes: 0,
        follows: 0,
        messagesSent: 0,
        totalMessageStarted: 0,
        totalMessageReplies: 0,
        connectionsSent: 0,
        connectionsAccepted: 0,
        messageReplyRate: 0,
        connectionAcceptanceRate: 0,
      },
      byDayStats: json.byDayStats ?? {},
    };
  } catch (err) {
    logError("POST", url, err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export interface HeyReachWebhook {
  id: number;
  webhookName: string;
  webhookUrl: string;
  eventType: string;
  campaignIds?: number[];
}

/** List all webhooks configured for the workspace. */
export async function getAllWebhooks(
  apiKey: string,
  params: { offset?: number; limit?: number } = {}
): Promise<HeyReachWebhook[]> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/webhooks/GetAll`;
  log("POST", url);
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      offset: params.offset ?? 0,
      limit: Math.min(params.limit ?? 100, 100),
    }),
  });
  return handleResponse<HeyReachWebhook[]>(response, "GetAll webhooks");
}

/** Create a new webhook subscription. */
export async function createWebhook(
  apiKey: string,
  webhook: {
    webhookName: string;
    webhookUrl: string;
    eventType: string;
    campaignIds?: number[];
  }
): Promise<HeyReachWebhook> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/webhooks/Create`;
  log("POST", url, { name: webhook.webhookName, eventType: webhook.eventType });
  const response = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify(webhook),
  });
  return handleResponse<HeyReachWebhook>(response, "Create webhook");
}

/** Delete a webhook by ID. */
export async function deleteWebhook(
  apiKey: string,
  webhookId: number
): Promise<void> {
  const key = resolveApiKey(apiKey);
  const url = `${HEYREACH_BASE}/webhooks/Delete?webhookId=${webhookId}`;
  log("DELETE", url);
  const response = await fetch(url, {
    method: "DELETE",
    headers: headers(key),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    logError("DELETE", url, new Error(`${response.status}: ${text}`));
    throw new Error(`HeyReach API error ${response.status}: ${text}`);
  }
  log("DELETE", url, { status: response.status });
}

/**
 * Register webhooks for all key event types.
 * Skips events that already have a webhook with the same URL registered.
 */
const WEBHOOK_EVENT_TYPES = [
  "CONNECTION_REQUEST_ACCEPTED",
  "EVERY_MESSAGE_REPLY_RECEIVED",
  "MESSAGE_SENT",
  "CONNECTION_REQUEST_SENT",
  "INMAIL_REPLY_RECEIVED",
  "CAMPAIGN_COMPLETED",
  "LEAD_TAG_UPDATED",
] as const;

export async function registerAllWebhooks(
  apiKey: string,
  baseUrl: string,
  secret: string,
  campaignIds?: number[]
): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const webhookUrl = `${baseUrl}/api/webhooks/heyreach/${secret}`;
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Fetch existing webhooks to avoid duplicates
  let existing: HeyReachWebhook[] = [];
  try {
    existing = await getAllWebhooks(apiKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[HeyReach] Failed to fetch existing webhooks: ${msg}`);
  }

  const existingUrls = new Set(existing.map((w) => `${w.eventType}::${w.webhookUrl}`));

  for (const eventType of WEBHOOK_EVENT_TYPES) {
    const key = `${eventType}::${webhookUrl}`;
    if (existingUrls.has(key)) {
      skipped.push(eventType);
      continue;
    }

    try {
      await createWebhook(apiKey, {
        webhookName: `Railway — ${eventType}`,
        webhookUrl,
        eventType,
        campaignIds,
      });
      created.push(eventType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${eventType}: ${msg}`);
    }
  }

  console.log(`[HeyReach] registerAllWebhooks: created=${created.length}, skipped=${skipped.length}, errors=${errors.length}`);
  return { created, skipped, errors };
}
