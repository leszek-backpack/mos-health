import "./env.js";

/**
 * google-auth-setup.ts — One-time OAuth2 setup for Google Drive
 *
 * Usage: npx tsx scripts/google-auth-setup.ts
 *
 * This opens a browser for Google login, gets an auth code, and exchanges
 * it for a refresh token. You only need to do this ONCE.
 *
 * Prerequisites:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create an OAuth2 Client ID (type: Desktop app)
 * 3. Copy the Client ID and Client Secret
 * 4. Enable the Google Drive API in your project
 *
 * After running this script, add these to your .env:
 *   GOOGLE_CLIENT_ID=<from GCP console>
 *   GOOGLE_CLIENT_SECRET=<from GCP console>
 *   GOOGLE_REFRESH_TOKEN=<output from this script>
 */

import { createServer } from "node:http";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

const REDIRECT_PORT = 3456;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const TOKEN_URL = "https://oauth2.googleapis.com/token";

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Google OAuth2 Setup                                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Before running this script, you need:                       ║
║                                                              ║
║  1. Go to: https://console.cloud.google.com/apis/credentials ║
║  2. Create OAuth2 Client ID (type: Desktop app)              ║
║  3. Enable "Google Drive API" in your GCP project            ║
║  4. Set these env vars:                                      ║
║     GOOGLE_CLIENT_ID=<your client id>                        ║
║     GOOGLE_CLIENT_SECRET=<your client secret>                ║
║                                                              ║
║  Then run this script again.                                 ║
╚══════════════════════════════════════════════════════════════╝
`);
    process.exit(1);
  }

  // Build auth URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent"); // Force refresh token

  console.log("\n1. Open this URL in your browser:\n");
  console.log(`   ${authUrl.toString()}\n`);
  console.log("2. Sign in with your Google account and authorize access.\n");
  console.log(`3. Waiting for redirect on port ${REDIRECT_PORT}...\n`);

  // Start local server to catch the redirect
  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h1>Error: ${error}</h1><p>Close this tab.</p>`);
        server.close();
        reject(new Error(`Auth error: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Success!</h1><p>You can close this tab and go back to the terminal.</p>");
        server.close();
        resolve(code);
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(REDIRECT_PORT, () => {
      // Try to open browser automatically
      import("node:child_process").then(({ exec }) => {
        exec(`open "${authUrl.toString()}"`);
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for authorization"));
    }, 300_000);
  });

  console.log("4. Got auth code. Exchanging for refresh token...\n");

  // Exchange code for tokens
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error(`Token exchange failed: ${tokenRes.status} ${text}`);
    process.exit(1);
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  if (!tokens.refresh_token) {
    console.error("No refresh token received. Try revoking access at https://myaccount.google.com/permissions and running again.");
    process.exit(1);
  }

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  SUCCESS! Add this to your .env file:                       ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║                                                              ║");
  console.log(`   GOOGLE_CLIENT_ID=${clientId}`);
  console.log(`   GOOGLE_CLIENT_SECRET=${clientSecret}`);
  console.log(`   GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("║                                                              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\nDone! You can now run: npx tsx scripts/create-google-doc.ts");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
