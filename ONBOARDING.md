# Getting Started — Mos Health OS

Hi Natalia! This guide gets you from zero to running your AI-powered workspace. ~20 minutes.

---

## What You're Setting Up

**Mos Health OS** is your AI workspace. You talk to Claude in a terminal and it does things for you:
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

## Step 7: Set Up Your Workspace

This is where the magic happens. Open **Cursor**, press `` Cmd + ` `` to open the terminal, and type:

```bash
claude
```

Then paste this message to Claude:

```
Set up my workspace from https://github.com/leszek-backpack/mos-health.git — clone it into ~/Documents/mos-health and install dependencies.
```

Claude will download the project and install everything. No GitHub account needed — the project is public.

Once it's done, **close Claude** (`/exit`), then open the folder in Cursor: **File → Open Folder → Documents → mos-health**

From now on, always open this folder in Cursor before starting Claude.

---

## Step 8: Set Up Environment Variables

Open Cursor with the `mos-health` folder. Open terminal (`` Cmd + ` ``), start Claude:

```bash
claude
```

Tell Claude:

```
Set up my .env file. Copy .env.example to .env and help me fill it in. Leszek gave me these keys: [paste the keys Leszek shared with you]
```

Claude will create the `.env` file and fill in the values.

### Google Refresh Token

If you don't have a Google refresh token yet, tell Claude:

```
Run the Google auth setup script to get my refresh token.
```

A browser will open — log in with your Google account. Claude will capture the token and add it to `.env`.

---

## Step 9: Connect Notion

With Claude still running in the `mos-health` folder, type:

```
/mcp
```

You'll see "notion" listed. Select it to authorize — a browser window opens, log in to Notion and grant access. Return to Claude — Notion is now connected.

---

## Step 10: Generate Your First Brief!

Still in Claude, type:

```
Generate a brief for https://www.linkedin.com/in/some-prospect-url
```

Claude works through 7 steps automatically (~2-3 minutes). You get a Google Doc URL at the end.

---

## Daily Usage

1. Open Cursor with the `mos-health` folder
2. Open terminal (`` Cmd + ` ``)
3. Type `claude`
4. Talk to it:

| What you say | What happens |
|---|---|
| "Generate a brief for [LinkedIn URL]" | Full pre-call brief → Google Doc |
| "Research [company name]" | Clay enrichment + web research |
| "Find contacts at [company]" | Clay contact search |
| "Enrich [LinkedIn URL]" | LinkedIn profile deep dive |
| "Check Notion for [topic]" | Search your Notion workspace |
| "Add meeting notes for [person]" | Create a Notion page |

Type `/exit` when done.

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
| RapidAPI test fails | Tell Claude: "the RapidAPI test failed" — it will debug |
| Google Doc test fails | Tell Claude: "run the Google auth setup again" |
| Claude says "not authenticated" | Run `claude` in terminal and log in again |
| Notion not connecting | Type `/mcp` inside Claude to re-authorize |
| Clay tools not available | Check Claude.ai → Settings → Connectors → Clay |
| Brief stops midway | Say "continue" or "please finish the brief" |

---

## Need Help?

- Ask Claude itself — type your question in plain English
- Message Leszek for API keys or setup issues
- [Claude Code docs](https://docs.anthropic.com/en/docs/claude-code)
