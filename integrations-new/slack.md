# Slack

## Access
- **MCP connector** — load via `ToolSearch` → `+slack`

## MCP Tools

| Tool | What it does |
|------|-------------|
| `slack_read_channel` | Read messages from a channel |
| `slack_read_thread` | Read a specific thread |
| `slack_search_public` | Search messages across public channels |
| `slack_send_message` | Send a message to a channel or DM |
| `slack_send_message_draft` | Preview before sending |
| `slack_schedule_message` | Schedule a message for later |
| `slack_search_users` | Find users by name |
| `slack_search_channels` | Find channels by name |
| `slack_read_user_profile` | Get user profile info |

## Notes
- Always use `slack_send_message_draft` first when sending to shared channels — confirm before posting
- For morning briefs / task digests: read relevant channels, summarize, post to a dedicated channel
