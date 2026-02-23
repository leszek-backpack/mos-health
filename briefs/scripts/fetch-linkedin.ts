import "./env.js";

/**
 * fetch-linkedin.ts — Standalone LinkedIn data fetcher via RapidAPI
 *
 * Usage: npx tsx scripts/fetch-linkedin.ts --url https://linkedin.com/in/username
 *
 * Fetches: profile, experience, posts, comments, company profile,
 *          company member insights, company jobs
 *
 * Outputs: JSON to stdout + writes to output/linkedin-data.json
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RAPIDAPI_HOST = "fresh-linkedin-scraper-api.p.rapidapi.com";
const DELAY_MS = 3000; // 3s between calls to respect rate limits

function getApiKey(): string {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.error("[fetch-linkedin] Missing RAPIDAPI_KEY env var");
    process.exit(1);
  }
  return key;
}

function buildHeaders(): Record<string, string> {
  return {
    "x-rapidapi-key": getApiKey(),
    "x-rapidapi-host": RAPIDAPI_HOST,
  };
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const qs = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    }
  }
  const query = qs.toString();
  return `https://${RAPIDAPI_HOST}${path}${query ? "?" + query : ""}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Types (subset — only what we need)
// ---------------------------------------------------------------------------

interface PaginatedResponse<T> {
  success: boolean;
  cost: number;
  total?: number;
  data: T;
  message?: string;
}

interface LinkedInProfile {
  id: string;
  urn: string;
  public_identifier: string;
  first_name: string;
  last_name: string;
  full_name: string;
  headline: string;
  location: {
    country: string;
    country_code: string;
    city: string;
    postal_code: string | null;
  };
  is_premium: boolean;
  is_open_to_work: boolean;
  is_hiring: boolean;
  website: { title: string; url: string } | null;
  [key: string]: unknown;
}

interface LinkedInExperience {
  title: string;
  location?: string;
  description?: string;
  date: { start: string; end: string | null };
  company: {
    id: string;
    name: string;
    url: string;
    logo?: unknown[];
  };
  [key: string]: unknown;
}

interface IncludedSection<T> {
  total: number;
  has_more: boolean;
  data: T[];
}

interface LinkedInPost {
  id: string;
  url: string;
  title: string;
  activity: {
    num_likes: number;
    num_comments: number;
    num_shares: number;
  };
  created_at: string;
  [key: string]: unknown;
}

interface LinkedInComment {
  text: string;
  author: {
    name: string;
    headline: string;
    profile_url: string;
  };
  posted_at: string;
  num_likes: number;
  [key: string]: unknown;
}

interface CompanyProfile {
  id: string;
  name: string;
  universal_name: string;
  description: string;
  linkedin_url: string;
  website_url: string;
  employee_count: number;
  employee_count_range: { start: number; end: number } | null;
  follower_count: number;
  founded_on: { day: number | null; month: number | null; year: number | null } | null;
  locations: { city?: string; country?: string; geographic_area?: string }[];
  industries: string[];
  specialities: string[];
  funding_info: unknown;
  [key: string]: unknown;
}

interface JobListing {
  job_id: string;
  title: string;
  company_name: string;
  location: string;
  posted_at: string;
  url: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  label: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T | null> {
  const url = buildUrl(path, params);
  console.error(`[fetch-linkedin] ${label}...`);
  try {
    const res = await fetch(url, { headers: buildHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[fetch-linkedin] ${label} HTTP ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as PaginatedResponse<T>;
    if (json.success === false) {
      console.error(`[fetch-linkedin] ${label} API error: ${json.message}`);
      return null;
    }
    console.error(`[fetch-linkedin] ${label} OK (cost: ${json.cost})`);
    return json.data;
  } catch (err) {
    console.error(`[fetch-linkedin] ${label} failed:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// URL parsing
// ---------------------------------------------------------------------------

function extractUsername(url: string): string {
  // Handle various LinkedIn URL formats
  const cleaned = url.replace(/\/+$/, ""); // strip trailing slashes
  const match = cleaned.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (!match?.[1]) {
    console.error(`[fetch-linkedin] Could not extract username from URL: ${url}`);
    process.exit(1);
  }
  return match[1];
}

function extractCompanySlug(companyUrl: string): string | null {
  // Handles both /company/slug/ and /company/12345/
  const match = companyUrl.match(/company\/([^/?#]+)/i);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const urlIdx = args.indexOf("--url");
  if (urlIdx === -1 || !args[urlIdx + 1]) {
    console.error("Usage: npx tsx scripts/fetch-linkedin.ts --url <linkedin_url>");
    process.exit(1);
  }

  const linkedinUrl = args[urlIdx + 1];
  const username = extractUsername(linkedinUrl);
  console.error(`[fetch-linkedin] Username: ${username}`);

  // 1. Profile (with experiences included)
  const profileData = await apiFetch<LinkedInProfile>("getUserProfile", "/api/v1/user/profile", {
    username,
    include_experiences: true,
  });
  await sleep(DELAY_MS);

  // Extract experience from profile response (nested as { total, has_more, data: [...] })
  const profile = profileData;
  const experienceSection = (profileData as any)?.experiences as IncludedSection<LinkedInExperience> | undefined;
  const experience = experienceSection?.data ?? null;

  // 2. Posts (page 1)
  const posts = await apiFetch<LinkedInPost[]>("getUserPosts", "/api/v1/user/posts", {
    username,
  });
  await sleep(DELAY_MS);

  // 4. Comments (page 1)
  const comments = await apiFetch<LinkedInComment[]>("getUserComments", "/api/v1/user/comments", {
    username,
  });
  await sleep(DELAY_MS);

  // 5. Company profile (from current employer)
  let company: CompanyProfile | null = null;
  let companyJobs: JobListing[] | null = null;

  const currentJob = experience?.find((e) => e.date?.end === "Present" || e.date?.end === null);
  const companyId = currentJob?.company?.id ?? null;

  if (companyId) {
    company = await apiFetch<CompanyProfile>("getCompanyProfile", "/api/v1/company/profile", {
      company_id: companyId,
    });
    await sleep(DELAY_MS);

    // 6. Company jobs (page 1)
    companyJobs = await apiFetch<JobListing[]>("getCompanyJobs", "/api/v1/company/jobs", {
      company_id: companyId,
    });
  } else {
    console.error("[fetch-linkedin] No current employer found — skipping company endpoints");
  }

  // Assemble output
  const output = {
    fetchedAt: new Date().toISOString(),
    linkedinUrl,
    username,
    profile,
    experience,
    posts,
    comments,
    company,
    companyJobs,
  };

  // Write to file
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const outPath = resolve(__dirname, "..", "..", "output", "linkedin-data.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.error(`[fetch-linkedin] Written to ${outPath}`);

  // Also output to stdout
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("[fetch-linkedin] Fatal:", err);
  process.exit(1);
});
