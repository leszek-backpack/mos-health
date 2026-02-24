# n8n — Workflow Automation

## Access
- **MCP connector** — load via `ToolSearch` → `+n8n`
- Self-hosted or cloud instance

## MCP Tools

| Tool | What it does |
|------|-------------|
| `search_workflows` | Find workflows by name or keyword |
| `get_workflow_details` | Get full workflow JSON + node config |
| `execute_workflow` | Trigger a workflow execution |

## Common Use Cases
- Triggering data pipelines (PhantomBuster → Clay → HubSpot)
- Webhook receivers for HeyReach events
- Scheduled enrichment runs

## Notes
- Prefer Trigger.dev for new automation in APP — n8n is used for legacy workflows and Mos Health ops
- When debugging a workflow, use `get_workflow_details` to inspect node configs before editing
