# Leszek Lammel — Global Claude Instructions

## Who I Am
**Leszek Lammel** — Co-Founder @ Backpack AI (Warsaw, Poland).
**Backpack AI** is a GTM automation agency that builds custom AI-powered workflows for B2B SaaS companies, automating sales, marketing, and revenue operations. Core tools: Clay, HeyReach, HubSpot, LinkedIn (RapidAPI), n8n, Notion.

LinkedIn: leszekl1 | vmid: 777478768

## Workspace
Primary workspace: `~/Documents/claude-code-leszek/`
See `CLAUDE.md` there for the full project map.

## Language
English always — code, docs, CLAUDE.md files, comments.
I speak Polish in conversation; respond in whichever language I use.

## Workflow Rules (apply to all projects)

### Planning
- Enter plan mode for ANY non-trivial task (3+ steps). Stop and re-plan if something goes sideways.
- Use parallel subagents liberally — offload research, exploration, analysis. One task per subagent.

### Execution
- Never mark complete without proving it works. Run tests, check logs.
- Just fix bugs — no context switching to the user. Point at logs/errors/tests → resolve.
- Make every change as simple as possible. Impact minimal code. No over-engineering.

### Integration Pre-flight
- Before writing code against any new endpoint: run existing test scripts or use MCP tools.
- Log raw `Object.keys(json)` before parsing — never assume field names.
- Add `console.log`/`console.error` to every external API call from day one.

### Error Handling
- Every client-side async call MUST use try/catch/finally. Move `setLoading(false)` into `.finally()`.
- Server actions returning `{ error }` is not enough — callers can still hang without `.catch()`.

### Self-Improvement
- After ANY correction → update `tasks/lessons.md` in the relevant project. Write rules to prevent repeats.

### Feedback Before Execution
- For any non-trivial output (files, CLAUDE.md changes, architecture proposals):
  show a draft first and ask for feedback before saving.
- Exception: small, obvious fixes where showing a draft adds no value.

### Self-Testing (Critical)
When building integrations, backend tasks, or anything executable:
- **Actually run it.** Don't say "done" without executing the code yourself.
- For Trigger.dev tasks: trigger them via CLI or test script and watch the logs.
- For API integrations: run the test script (`npx tsx scripts/test-*.ts`) and verify real output.
- For server actions / Next.js routes: use `curl` or trigger via the UI if accessible.
- Only skip self-testing if execution is genuinely impossible (requires user credentials,
  production-only env, irreversible side effects like sending emails to real contacts).
- If a test fails → fix it. Don't hand back broken work with "it should work."

### Done Checklist
Before marking any integration task complete:
1. Confirm field names against actual logged output
2. Audit the whole file for the same pattern just fixed
3. `npm run build` passes (for TS projects)

## Updating These Rules
When I say **"update rules"** (or "zaktualizuj zasady"):
1. Identify which principle to add/change based on the conversation
2. Show the proposed change as a diff (old → new)
3. Wait for approval, then update `~/.claude/CLAUDE.md`
