const HS_BASE = "https://api.hubapi.com";

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(method: string, url: string, extra?: Record<string, unknown>) {
  const masked = url.replace(/Bearer [^\s]+/gi, "Bearer ***");
  console.log(`[HubSpot] ${method} ${masked}`, extra ? JSON.stringify(extra) : "");
}

function logError(method: string, url: string, error: unknown) {
  const masked = url.replace(/Bearer [^\s]+/gi, "Bearer ***");
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[HubSpot] FAILED ${method} ${masked}: ${msg}`);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApprovedProspect {
  email: string;
  approvedMessage: string;
}

interface PushResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export interface HSContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  jobtitle?: string;
  phone?: string;
  website?: string;
  linkedin_contact_page?: string;
  [key: string]: string | undefined;
}

export interface HSCompanyProperties {
  name: string;
  domain?: string;
  industry?: string;
  numberofemployees?: string;
  city?: string;
  country?: string;
  phone?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface HSDealProperties {
  dealname: string;
  amount?: string;
  dealstage?: string;
  pipeline?: string;
  closedate?: string;
  hubspot_owner_id?: string;
  [key: string]: string | undefined;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveToken(apiKey?: string): string {
  const t = apiKey || process.env.HUBSPOT_ACCESS_TOKEN;
  if (!t) throw new Error("HUBSPOT_ACCESS_TOKEN is required");
  return t;
}

function authHeaders(apiKey?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${resolveToken(apiKey)}`,
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`HubSpot error ${response.status}: ${text}`);
  }
  return response.json() as Promise<T>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Portal / account info
// ---------------------------------------------------------------------------

/** Module-level cache for portal ID — constant for the lifetime of the process. */
let _portalId: number | null = null;

/** Module-level cache for contact property definitions (TTL: 5 min). */
let _propsCache: HSPropertyDefinition[] | null = null;
let _propsCacheTime = 0;
const PROPS_CACHE_TTL_MS = 5 * 60 * 1000;

async function getPortalId(apiKey?: string): Promise<number> {
  if (_portalId !== null) return _portalId;
  const url = `${HS_BASE}/account-info/v3/details`;
  log("GET", url);
  const response = await fetch(url, {
    headers: authHeaders(apiKey),
  });
  log("GET", url, { status: response.status });
  const data = await handleResponse<{ portalId: number }>(response);
  _portalId = data.portalId;
  return data.portalId;
}

// ---------------------------------------------------------------------------
// Token validation
// ---------------------------------------------------------------------------

/**
 * Lightweight validation — calls GET /account-info/v3/details with 10s timeout.
 * Returns true/false, never throws.
 */
export async function checkAccessToken(accessToken: string): Promise<boolean> {
  const url = `${HS_BASE}/account-info/v3/details`;
  log("GET", url, { purpose: "checkAccessToken" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
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
// Contacts — bulk status check
// ---------------------------------------------------------------------------

export interface HSContactStatus {
  email: string;
  contactId: string | null;
  /** Full HubSpot contact URL, or null if not found. */
  profileUrl: string | null;
}

export interface HSContactLookup {
  email: string;
  /** HubSpot `vmid` property value — preferred identifier. Falls back to email. */
  vmid?: string | null;
}

/**
 * Check which contacts exist in HubSpot and return their profile URLs.
 * Uses vmid as the primary lookup key (HubSpot property "vmid").
 * Falls back to email for contacts without a vmid.
 * Uses the batch read endpoint — one request per 100 contacts.
 */
export async function batchCheckContacts(
  apiKey: string | undefined,
  contacts: HSContactLookup[]
): Promise<HSContactStatus[]> {
  if (contacts.length === 0) return [];

  const portalId = await getPortalId(apiKey);
  const BATCH = 100;
  const found = new Map<string, string>(); // email.toLowerCase() → contactId

  const withVmid = contacts.filter((c) => c.vmid?.trim());
  const withoutVmid = contacts.filter((c) => !c.vmid?.trim());

  // --- Lookup by vmid (primary) ---
  const vmidToEmail = new Map<string, string>();
  for (const c of withVmid) vmidToEmail.set(c.vmid!, c.email);

  for (let i = 0; i < withVmid.length; i += BATCH) {
    const chunk = withVmid.slice(i, i + BATCH);
    const url = `${HS_BASE}/crm/v3/objects/contacts/batch/read`;
    try {
      log("POST", url, { idProperty: "vmid", count: chunk.length });
      const response = await fetch(url, {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify({
          idProperty: "vmid",
          inputs: chunk.map((c) => ({ id: c.vmid! })),
          properties: ["vmid"],
        }),
      });
      log("POST", url, { status: response.status });
      // 207 = partial success (some not found) — still useful
      if (!response.ok && response.status !== 207) continue;
      const data = await response.json();
      for (const result of data.results ?? []) {
        const vmid = result.properties?.vmid as string | undefined;
        const email = vmid ? vmidToEmail.get(vmid) : undefined;
        if (email && result.id) found.set(email.toLowerCase(), result.id as string);
      }
    } catch (err) {
      logError("POST", url, err);
    }
    if (i + BATCH < withVmid.length) await delay(100);
  }

  // --- Lookup by email (fallback for contacts without vmid) ---
  for (let i = 0; i < withoutVmid.length; i += BATCH) {
    const chunk = withoutVmid.slice(i, i + BATCH);
    const url = `${HS_BASE}/crm/v3/objects/contacts/batch/read`;
    try {
      log("POST", url, { idProperty: "email", count: chunk.length });
      const response = await fetch(url, {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify({
          idProperty: "email",
          inputs: chunk.map((c) => ({ id: c.email })),
          properties: ["email"],
        }),
      });
      log("POST", url, { status: response.status });
      if (!response.ok && response.status !== 207) continue;
      const data = await response.json();
      for (const result of data.results ?? []) {
        const email = (result.properties?.email as string | undefined)?.toLowerCase();
        if (email && result.id) found.set(email, result.id as string);
      }
    } catch (err) {
      logError("POST", url, err);
    }
    if (i + BATCH < withoutVmid.length) await delay(100);
  }

  return contacts.map((c) => {
    const contactId = found.get(c.email.toLowerCase()) ?? null;
    return {
      email: c.email,
      contactId,
      profileUrl: contactId
        ? `https://app.hubspot.com/contacts/${portalId}/contact/${contactId}`
        : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export interface HSPropertyDefinition {
  name: string;
  label: string;
  type: string;         // "string" | "number" | "enumeration" | "date" | "bool" etc.
  fieldType: string;    // "text" | "textarea" | "select" | "checkbox" etc.
  groupName: string;
  description?: string;
  readOnlyValue?: boolean;
  hidden?: boolean;
  calculated?: boolean;
}

/**
 * Fetch all contact property definitions from HubSpot.
 * Cached in memory for 5 minutes — safe to call on every dialog open.
 * Filters out read-only, hidden, and calculated properties.
 */
export async function getContactProperties(
  apiKey?: string
): Promise<HSPropertyDefinition[]> {
  const now = Date.now();
  if (_propsCache && now - _propsCacheTime < PROPS_CACHE_TTL_MS) {
    return _propsCache;
  }
  const url = `${HS_BASE}/crm/v3/properties/contacts?archived=false`;
  log("GET", url);
  const response = await fetch(url, { headers: authHeaders(apiKey) });
  log("GET", url, { status: response.status });
  const data = await handleResponse<{ results: HSPropertyDefinition[] }>(response);
  _propsCache = data.results
    .filter((p) => !p.readOnlyValue && !p.hidden && !p.calculated)
    .sort((a, b) => a.label.localeCompare(b.label));
  _propsCacheTime = now;
  return _propsCache;
}

// ---------------------------------------------------------------------------
// Contacts — search & find
// ---------------------------------------------------------------------------

/** Find a contact by email. Returns the HubSpot contact ID or null. */
export async function findContactByEmail(
  apiKey: string | undefined,
  email: string
): Promise<string | null> {
  const url = `${HS_BASE}/crm/v3/objects/contacts/search`;
  log("POST", url, { email });
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
        ],
        limit: 1,
      }),
    });
    log("POST", url, { status: response.status });
    if (!response.ok) return null;
    const data = await response.json();
    return data.results?.[0]?.id ?? null;
  } catch (err) {
    logError("POST", url, err);
    return null;
  }
}

/**
 * Search contacts with arbitrary filters.
 * Returns an array of { id, properties } objects.
 */
export async function searchContacts(
  apiKey: string | undefined,
  filters: { propertyName: string; operator: string; value: string }[],
  properties: string[] = ["email", "firstname", "lastname", "company"],
  limit = 100
): Promise<{ id: string; properties: Record<string, string> }[]> {
  const url = `${HS_BASE}/crm/v3/objects/contacts/search`;
  log("POST", url, { filterCount: filters.length, limit });
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      filterGroups: [{ filters }],
      properties,
      limit,
    }),
  });
  log("POST", url, { status: response.status });
  const data = await handleResponse<{
    results: { id: string; properties: Record<string, string> }[];
  }>(response);
  return data.results;
}

// ---------------------------------------------------------------------------
// Contacts — create & update
// ---------------------------------------------------------------------------

/**
 * Get full contact details by HubSpot contact ID.
 * Includes lead status, last contacted, and engagement counts.
 */
export async function getContactTouchpoints(apiKey: string | undefined, contactId: string) {
  const url = `${HS_BASE}/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,company,jobtitle,notes_last_contacted,num_contacted_notes,hs_lead_status`;
  log("GET", url);
  const response = await fetch(url, { headers: authHeaders(apiKey) });
  log("GET", url, { status: response.status });
  if (!response.ok) throw new Error(`HubSpot error: ${response.status}`);
  return response.json();
}

/**
 * Upsert a batch of contacts by email in one API call.
 * Creates contacts that don't exist, updates those that do.
 * Max 100 per batch (HubSpot limit).
 */
export async function batchUpsertContacts(
  apiKey: string | undefined,
  contacts: HSContactProperties[]
): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  const BATCH_SIZE = 100;

  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    const inputs = batch.map((c) => ({
      id: c.email,
      idProperty: "email",
      properties: c,
    }));

    const url = `${HS_BASE}/crm/v3/objects/contacts/batch/upsert`;
    try {
      log("POST", url, { batchNum: i / BATCH_SIZE + 1, count: batch.length });
      const response = await fetch(url, {
        method: "POST",
        headers: authHeaders(apiKey),
        body: JSON.stringify({ inputs }),
      });
      log("POST", url, { status: response.status });

      if (!response.ok) {
        const text = await response.text();
        result.errors.push(`Batch ${i / BATCH_SIZE + 1}: ${text}`);
        continue;
      }

      const data = await response.json();
      for (const r of data.results ?? []) {
        if (r.status === "created") result.created++;
        else result.updated++;
      }
    } catch (error) {
      logError("POST", url, error);
      result.errors.push(
        `Batch ${i / BATCH_SIZE + 1}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    if (i + BATCH_SIZE < contacts.length) await delay(200);
  }

  return result;
}

/** Import contacts one by one (upsert: create if missing, update if exists). */
export async function importContacts(
  apiKey: string | undefined,
  contacts: HSContactProperties[]
): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };

  for (const contact of contacts) {
    try {
      const existing = await findContactByEmail(apiKey, contact.email);

      if (existing) {
        const url = `${HS_BASE}/crm/v3/objects/contacts/${existing}`;
        log("PATCH", url);
        const response = await fetch(url, {
          method: "PATCH",
          headers: authHeaders(apiKey),
          body: JSON.stringify({ properties: contact }),
        });
        log("PATCH", url, { status: response.status });
        result.updated++;
      } else {
        const url = `${HS_BASE}/crm/v3/objects/contacts`;
        log("POST", url, { email: contact.email });
        const res = await fetch(url, {
          method: "POST",
          headers: authHeaders(apiKey),
          body: JSON.stringify({ properties: contact }),
        });
        log("POST", url, { status: res.status });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
        result.created++;
      }
    } catch (error) {
      result.errors.push(
        `${contact.email}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    await delay(100);
  }

  return result;
}

/**
 * Push approved outbound copy back to a HubSpot contact property.
 * (Legacy function — kept for backward compatibility with export flow.)
 */
export async function pushToHubSpot(
  prospects: ApprovedProspect[]
): Promise<PushResult> {
  const result: PushResult = {
    total: prospects.length,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  for (const prospect of prospects) {
    try {
      const contactId = await findContactByEmail(undefined, prospect.email);

      if (!contactId) {
        result.failed++;
        result.errors.push(`${prospect.email}: Contact not found in HubSpot`);
        continue;
      }

      const url = `${HS_BASE}/crm/v3/objects/contacts/${contactId}`;
      log("PATCH", url, { email: prospect.email });
      const response = await fetch(url, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          properties: { approved_outbound_copy: prospect.approvedMessage },
        }),
      });
      log("PATCH", url, { status: response.status });

      if (!response.ok) {
        const errorText = await response.text();
        result.failed++;
        result.errors.push(`${prospect.email}: ${errorText}`);
      } else {
        result.succeeded++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(
        `${prospect.email}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    await delay(100);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

/** Search for a company by domain name (e.g. "acme.com"). */
export async function searchCompanyByDomain(
  apiKey: string | undefined,
  domain: string
): Promise<{ id: string; properties: Record<string, string> } | null> {
  const url = `${HS_BASE}/crm/v3/objects/companies/search`;
  log("POST", url, { domain });
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "domain", operator: "EQ", value: domain }] },
        ],
        properties: ["name", "domain", "industry", "numberofemployees"],
        limit: 1,
      }),
    });
    log("POST", url, { status: response.status });
    if (!response.ok) return null;
    const data = await response.json();
    return data.results?.[0] ?? null;
  } catch (err) {
    logError("POST", url, err);
    return null;
  }
}

/** Create a new company. Returns the new company ID. */
export async function createCompany(
  apiKey: string | undefined,
  properties: HSCompanyProperties
): Promise<string> {
  const url = `${HS_BASE}/crm/v3/objects/companies`;
  log("POST", url, { name: properties.name, domain: properties.domain });
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ properties }),
  });
  log("POST", url, { status: response.status });
  const data = await handleResponse<{ id: string }>(response);
  return data.id;
}

/** Associate an existing contact to an existing company. */
export async function associateContactToCompany(
  apiKey: string | undefined,
  contactId: string,
  companyId: string
): Promise<void> {
  const url = `${HS_BASE}/crm/v4/associations/contacts/companies/batch/create`;
  log("POST", url, { contactId, companyId });
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      inputs: [
        {
          from: { id: contactId },
          to: { id: companyId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 1 }],
        },
      ],
    }),
  });
  log("POST", url, { status: response.status });
  await handleResponse<unknown>(response);
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------

/** Create a new deal. Returns the new deal ID. */
export async function createDeal(
  apiKey: string | undefined,
  properties: HSDealProperties
): Promise<string> {
  const url = `${HS_BASE}/crm/v3/objects/deals`;
  log("POST", url, { dealname: properties.dealname });
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ properties }),
  });
  log("POST", url, { status: response.status });
  const data = await handleResponse<{ id: string }>(response);
  return data.id;
}

/** Update an existing deal by ID. */
export async function updateDeal(
  apiKey: string | undefined,
  dealId: string,
  properties: Partial<HSDealProperties>
): Promise<void> {
  const url = `${HS_BASE}/crm/v3/objects/deals/${dealId}`;
  log("PATCH", url);
  const response = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ properties }),
  });
  log("PATCH", url, { status: response.status });
  await handleResponse<unknown>(response);
}

/** Associate a deal with a contact. */
export async function associateDealToContact(
  apiKey: string | undefined,
  dealId: string,
  contactId: string
): Promise<void> {
  const url = `${HS_BASE}/crm/v4/associations/deals/contacts/batch/create`;
  log("POST", url, { dealId, contactId });
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      inputs: [
        {
          from: { id: dealId },
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }],
        },
      ],
    }),
  });
  log("POST", url, { status: response.status });
  await handleResponse<unknown>(response);
}

/** Associate a deal with a company. */
export async function associateDealToCompany(
  apiKey: string | undefined,
  dealId: string,
  companyId: string
): Promise<void> {
  const url = `${HS_BASE}/crm/v4/associations/deals/companies/batch/create`;
  log("POST", url, { dealId, companyId });
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      inputs: [
        {
          from: { id: dealId },
          to: { id: companyId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 5 }],
        },
      ],
    }),
  });
  log("POST", url, { status: response.status });
  await handleResponse<unknown>(response);
}

// ---------------------------------------------------------------------------
// Engagements — Notes & Emails
// ---------------------------------------------------------------------------

/**
 * Create a note on a contact and log it as an engagement.
 * Appears in the contact's activity timeline in HubSpot.
 */
export async function createNote(
  apiKey: string | undefined,
  contactId: string,
  body: string,
  timestamp?: Date
): Promise<string> {
  // Step 1: create the note object
  const noteUrl = `${HS_BASE}/crm/v3/objects/notes`;
  log("POST", noteUrl, { contactId });
  const noteResponse = await fetch(noteUrl, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      properties: {
        hs_note_body: body,
        hs_timestamp: (timestamp ?? new Date()).toISOString(),
      },
    }),
  });
  log("POST", noteUrl, { status: noteResponse.status });
  const note = await handleResponse<{ id: string }>(noteResponse);

  // Step 2: associate note → contact
  const assocUrl = `${HS_BASE}/crm/v4/associations/notes/contacts/batch/create`;
  log("POST", assocUrl, { noteId: note.id, contactId });
  const assocResponse = await fetch(assocUrl, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      inputs: [
        {
          from: { id: note.id },
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        },
      ],
    }),
  });
  log("POST", assocUrl, { status: assocResponse.status });

  return note.id;
}

/**
 * Log an outbound email engagement to a contact's timeline.
 * Does NOT send the email — use this for recording emails sent elsewhere.
 */
export async function logEmail(
  apiKey: string | undefined,
  contactId: string,
  subject: string,
  body: string,
  timestamp?: Date
): Promise<string> {
  const emailUrl = `${HS_BASE}/crm/v3/objects/emails`;
  log("POST", emailUrl, { contactId, subject });
  const emailResponse = await fetch(emailUrl, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      properties: {
        hs_email_subject: subject,
        hs_email_text: body,
        hs_email_direction: "EMAIL",
        hs_timestamp: (timestamp ?? new Date()).toISOString(),
      },
    }),
  });
  log("POST", emailUrl, { status: emailResponse.status });
  const email = await handleResponse<{ id: string }>(emailResponse);

  const assocUrl = `${HS_BASE}/crm/v4/associations/emails/contacts/batch/create`;
  log("POST", assocUrl, { emailId: email.id, contactId });
  const assocResponse = await fetch(assocUrl, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({
      inputs: [
        {
          from: { id: email.id },
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 198 }],
        },
      ],
    }),
  });
  log("POST", assocUrl, { status: assocResponse.status });

  return email.id;
}
