# Getting Started — Mos Health OS

Hi Natalia! This guide gets you from zero to running your AI-powered workspace. ~30 minutes total.

---

## What You're Setting Up

**Mos Health OS** is your AI workspace. You talk to Claude Code in a terminal and it does things for you:
- Generate pre-call intelligence briefs from a LinkedIn URL
- Research companies and contacts via Clay
- Pull LinkedIn data via RapidAPI
- Read and write to your Notion workspace

There is no app to click through. You type commands in plain English, and Claude executes.

---

## What You Need to Install

| Tool | What it is | Cost |
|------|-----------|------|
| **Cursor** | Your code editor (where you'll work) | Free |
| **Node.js** | Runs the LinkedIn & Google Docs scripts | Free |
| **Claude Pro** | AI subscription that powers everything | $20/month |
| **Claude Code** | The AI agent that lives in your terminal | Free (included with Claude Pro) |

---

## Step 1: Install Cursor

1. Go to [cursor.com](https://www.cursor.com/) and download the Mac version
2. Open the `.dmg` file and drag Cursor to **Applications**
3. Launch Cursor — use defaults for the initial setup

---

## Step 2: Install Node.js

Open **Terminal** (press `Cmd + Space`, type "Terminal", hit Enter):

```bash
node --version
```

If you see v18 or higher, skip to Step 3. If not:

1. Go to [nodejs.org](https://nodejs.org/) and download the **LTS** version for Mac
2. Open the installer and follow the steps
3. Close and reopen Terminal, then verify: `node --version`

---

## Step 3: Subscribe to Claude Pro

1. Go to [claude.ai](https://claude.ai) and create an account (or log in)
2. Go to [claude.ai/pricing](https://claude.ai/pricing)
3. Subscribe to **Claude Pro** ($20/month)
4. Remember the email you used

---

## Step 4: Install Claude Code

In **Terminal**, run:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Close and reopen Terminal.** Then verify:

```bash
claude --version
```

---

## Step 5: Log In to Claude Code

```bash
claude
```

A browser opens — log in with the same email from Step 3. Once authenticated, type `/exit`.

You only need to do this once.

---

## Step 6: Connect Clay

Clay gives you company and contact enrichment data.

1. Go to [claude.ai](https://claude.ai) in your browser
2. Click your profile icon → **Settings** → **Connectors**
3. Find **Clay** and click **Connect**
4. Follow the authorization flow with your Clay account
5. Done — Clay tools are now available in Claude Code automatically

---

## Step 7: Connect Notion

Notion lets Claude read and write to your workspace.

1. Open Cursor and press `` Cmd + ` `` to open the terminal
2. Navigate to the project (you'll clone it in Step 8, so come back to this after):
   ```bash
   cd ~/Documents/mos-health
   claude
   ```
3. Inside Claude Code, type:
   ```
   /mcp
   ```
4. You'll see "notion" listed — click or select it to authorize
5. A browser window opens — log in to Notion and grant access to your workspace
6. Return to Claude Code — Notion is now connected

**Note:** If Notion isn't listed, the `.mcp.json` file in the project handles this automatically. Just make sure you're in the `mos-health` folder when you run `claude`.

---

## Step 8: Clone the Project

Open Cursor, press `` Cmd + ` `` for terminal:

```bash
cd ~/Documents
git clone https://github.com/leszek-backpack/mos-health.git
cd mos-health
npm install
```

Open the folder in Cursor: **File → Open Folder → Documents → mos-health**

---

## Step 9: Set Up Environment Variables

In Cursor's terminal:

```bash
cp .env.example .env
```

Open `.env` in Cursor and fill in the values (Leszek will share these with you):

```bash
RAPIDAPI_KEY=_______________
GOOGLE_CLIENT_ID=_______________
GOOGLE_CLIENT_SECRET=_______________
GOOGLE_REFRESH_TOKEN=_______________
GOOGLE_FOLDER_ID=_______________
```

### Getting the Google Refresh Token

If you don't have one yet:

1. Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are filled in
2. Run:
   ```bash
   npx tsx briefs/scripts/google-auth-setup.ts
   ```
3. Browser opens — log in with your Google account
4. Copy the `GOOGLE_REFRESH_TOKEN` it prints → paste into `.env`

---

## Step 10: Run Smoke Tests

Verify everything works:

```bash
npx tsx briefs/scripts/test-rapidapi.ts
```
Should fetch Bill Gates' LinkedIn profile.

```bash
npx tsx briefs/scripts/test-google-docs.ts
```
Should create and delete a test Google Doc.

---

## Step 11: Generate Your First Brief!

1. In Cursor's terminal, make sure you're in `~/Documents/mos-health`
2. Start Claude Code:
   ```bash
   claude
   ```
3. Type:
   ```
   Generate a brief for https://www.linkedin.com/in/some-prospect-url
   ```
4. Claude works through 7 steps automatically (~2-3 minutes)
5. You get a Google Doc URL at the end

---

## Daily Usage

Open Cursor with the `mos-health` folder, then in terminal:

```bash
claude
```

Now just talk to it:

| What you say | What happens |
|---|---|
| "Generate a brief for [LinkedIn URL]" | Full pre-call brief → Google Doc |
| "Research [company name]" | Clay enrichment + web research |
| "Find contacts at [company]" | Clay contact search |
| "Enrich [LinkedIn URL]" | LinkedIn profile deep dive |
| "Check Notion for [topic]" | Search your Notion workspace |
| "Add meeting notes for [person]" | Create a Notion page |

Type `/exit` when done. Start a new session anytime with `claude`.

---

## Tips

- **Multi-line messages:** `Shift + Enter` for new line, `Enter` to send
- **Start fresh:** Type `/clear` if Claude seems confused
- **Permission prompts:** Claude will ask before running scripts — type `y` (this is normal and safe)
- **If something fails:** Tell Claude what happened. It will troubleshoot and retry.
- **Exit:** `/exit` or `Ctrl + C`
- **Check cost:** Type `/cost` to see how much you've used this session

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "command not found: claude" | Close and reopen Terminal |
| "command not found: node" | Install Node.js (Step 2) |
| RapidAPI test fails | Check `RAPIDAPI_KEY` in `.env` — ask Leszek |
| Google Doc test fails | Re-run `npx tsx briefs/scripts/google-auth-setup.ts` |
| Claude says "not authenticated" | Run `claude` in terminal and log in again |
| Notion not connecting | Run `/mcp` inside Claude Code to re-authorize |
| Clay tools not available | Check Claude.ai → Settings → Connectors → Clay |
| Brief stops midway | Say "continue" or "please finish the brief" |

---

## Need Help?

- Ask Claude Code itself — type your question in plain English
- Message Leszek for API keys or setup issues
- [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code)
