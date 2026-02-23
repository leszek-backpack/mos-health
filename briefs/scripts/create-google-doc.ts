import "./env.js";

/**
 * create-google-doc.ts — Create a Google Doc from an HTML file
 *
 * Usage: npx tsx scripts/create-google-doc.ts --title "John Doe" --html-file output/brief.html
 *
 * Auth: OAuth2 refresh token (user's own Google account).
 *       Run `npx tsx scripts/google-auth-setup.ts` once to get the refresh token.
 *
 * Strategy: Multipart upload to Drive API (HTML → Google Doc conversion).
 *           Same approach as the n8n workflow.
 *
 * Outputs JSON to stdout: { docId, docUrl, title }
 */

import { readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error(
      "[create-google-doc] Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN.\n" +
      "Run `npx tsx scripts/google-auth-setup.ts` to set up OAuth2."
    );
    process.exit(1);
  }

  return { clientId, clientSecret, refreshToken };
}

// ---------------------------------------------------------------------------
// OAuth2 token exchange
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getConfig();

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
    const text = await res.text();
    console.error(`[create-google-doc] Token refresh failed: ${res.status} ${text}`);
    process.exit(1);
  }

  const json = await res.json() as { access_token: string };
  return json.access_token;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  const titleIdx = args.indexOf("--title");
  const htmlIdx = args.indexOf("--html-file");

  if (titleIdx === -1 || !args[titleIdx + 1]) {
    console.error("Missing --title argument");
    process.exit(1);
  }
  if (htmlIdx === -1 || !args[htmlIdx + 1]) {
    console.error("Missing --html-file argument");
    process.exit(1);
  }

  const title = args[titleIdx + 1];
  const htmlFile = args[htmlIdx + 1];

  let htmlContent: string;
  try {
    htmlContent = readFileSync(htmlFile, "utf-8");
  } catch (err) {
    console.error(`[create-google-doc] Cannot read file: ${htmlFile}`, err);
    process.exit(1);
    return;
  }

  const accessToken = await getAccessToken();
  const folderId = process.env.GOOGLE_FOLDER_ID || "1loTlwq5gnACjCqExu2xCQvR7bS_hJS2A";

  console.error(`[create-google-doc] Creating doc: "${title}"`);

  // Wrap HTML with basic styling (same as n8n workflow)
  const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; }
    h1 { font-size: 18pt; margin-bottom: 16pt; }
    h3 { font-size: 13pt; margin-top: 20pt; margin-bottom: 8pt; }
    h4 { font-size: 11pt; margin-top: 14pt; margin-bottom: 6pt; }
    p  { margin-bottom: 10pt; }
    ul, ol { margin-bottom: 14pt; padding-left: 20pt; }
    li { margin-bottom: 8pt; line-height: 1.5; }
    b  { font-weight: bold; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  // Build multipart body (same approach as n8n)
  const boundary = "mos-brief-boundary";
  const metadata = JSON.stringify({
    name: title,
    mimeType: "application/vnd.google-apps.document",
    parents: [folderId],
  });

  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html\r\n\r\n` +
    `${styledHtml}\r\n` +
    `--${boundary}--\r\n`;

  const res = await fetch(
    `${DRIVE_UPLOAD_URL}?uploadType=multipart&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`[create-google-doc] Drive API error: ${res.status} ${text}`);
    process.exit(1);
  }

  const data = await res.json() as { id: string; webViewLink?: string };
  const docId = data.id;
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

  console.error(`[create-google-doc] Created: ${docUrl}`);

  const output = { docId, docUrl, title };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("[create-google-doc] Fatal:", err);
  process.exit(1);
});
