import "./env.js";

/**
 * Smoke test — verify RapidAPI LinkedIn scraping works
 *
 * Usage: npx tsx scripts/test-rapidapi.ts
 *
 * Tests getUserProfile for a known public profile (Bill Gates).
 */

const RAPIDAPI_HOST = "fresh-linkedin-scraper-api.p.rapidapi.com";

async function main() {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    console.error("Missing RAPIDAPI_KEY env var");
    process.exit(1);
  }

  const url = `https://${RAPIDAPI_HOST}/api/v1/user/profile?username=williamhgates`;
  console.log("Fetching profile for williamhgates...");

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const json = await res.json();

  if (!json.success) {
    console.error("API returned success=false:", json.message);
    process.exit(1);
  }

  const data = json.data;
  console.log("Profile keys:", Object.keys(data));
  console.log("Name:", data.full_name);
  console.log("Headline:", data.headline);
  console.log("Location:", JSON.stringify(data.location));
  console.log("Public identifier:", data.public_identifier);

  // Verify expected shape
  const requiredFields = ["id", "full_name", "headline", "public_identifier", "location"];
  const missing = requiredFields.filter((f) => !(f in data));
  if (missing.length) {
    console.error("Missing fields:", missing);
    process.exit(1);
  }

  console.log("\nSmoke test PASSED");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
