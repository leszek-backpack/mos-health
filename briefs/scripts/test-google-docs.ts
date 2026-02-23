import "./env.js";

/**
 * Smoke test — verify Google Docs creation works via OAuth2
 *
 * Usage: npx tsx scripts/test-google-docs.ts
 *
 * Creates a test doc, verifies it exists, then deletes it.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN");
    process.exit(1);
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    console.error(`Token refresh failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const json = await res.json() as { access_token: string };
  return json.access_token;
}

async function main() {
  const accessToken = await getAccessToken();
  console.log("Got access token.");

  const testHtml = "<h1>Smoke Test</h1><p>Created by mos-brief test script.</p>";
  const folderId = process.env.GOOGLE_FOLDER_ID || "1loTlwq5gnACjCqExu2xCQvR7bS_hJS2A";

  // Create
  console.log("Creating test doc...");
  const boundary = "test-boundary";
  const metadata = JSON.stringify({
    name: "[TEST] mos-brief smoke test",
    mimeType: "application/vnd.google-apps.document",
    parents: [folderId],
  });

  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: text/html\r\n\r\n${testHtml}\r\n--${boundary}--\r\n`;

  const createRes = await fetch(
    `${DRIVE_UPLOAD_URL}?uploadType=multipart&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!createRes.ok) {
    console.error(`Create failed: ${createRes.status} ${await createRes.text()}`);
    process.exit(1);
  }

  const data = await createRes.json() as { id: string };
  const docId = data.id;
  console.log(`Created: https://docs.google.com/document/d/${docId}/edit`);

  if (!docId) {
    console.error("No doc ID returned");
    process.exit(1);
  }

  // Delete
  console.log("Deleting test doc...");
  const deleteRes = await fetch(`${DRIVE_FILES_URL}/${docId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!deleteRes.ok && deleteRes.status !== 204) {
    console.error(`Delete failed: ${deleteRes.status}`);
    process.exit(1);
  }
  console.log("Deleted.");

  console.log("\nSmoke test PASSED");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
