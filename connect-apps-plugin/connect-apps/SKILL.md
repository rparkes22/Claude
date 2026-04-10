---
name: connect-apps
description: Connect external applications and services using Composio — authenticate accounts, execute actions, and set up event-driven integrations across 1000+ apps
tags: [connect-apps, composio, integrations, oauth, api, automation]
agents:
  - claude
---

## When to Apply

- User wants to connect an app (Gmail, Slack, GitHub, Notion, Jira, etc.) to their workflow
- User asks "how do I connect X?" or "set up X integration"
- User wants to authenticate an account for use by an agent
- User wants to trigger actions or receive events from external services
- User needs to link accounts for multi-app automation

## Quickstart

Check if Composio CLI is installed; if not, install it:
```bash
curl -fsSL https://composio.dev/install | bash
composio login       # OAuth flow — use -y to skip org/project picker
composio whoami      # verify login
```

For agents without browser access:
```bash
composio login --no-wait | jq   # get URL + key; share URL with user
composio login --key "<key>" --no-wait   # complete once user logs in
```

---

## Workflow: find → connect → use

### 1. Find the right app/tool
```bash
composio search "<what you want to do>"
# e.g. composio search "send slack message"
```

### 2. Connect an account
```bash
composio link <app>
# e.g. composio link slack
# e.g. composio link github --no-wait   # non-interactive/agent mode
```
Only needed once per app. `--no-wait` exits immediately with link URL and JSON.

### 3. Execute a tool
```bash
composio execute <TOOL_SLUG> --data '<json>'
# e.g. composio execute SLACK_SENDS_A_MESSAGE --data '{"channel":"#general","text":"Hello"}'
```

See a tool's parameters first:
```bash
composio execute <TOOL_SLUG> --help
```

### 4. Listen for events (optional)
```bash
composio listen   # streams real-time trigger events
```

---

## Common App Examples

| Goal | Command |
|---|---|
| Send an email | `composio search "send email"` → link gmail → execute |
| Create a GitHub issue | `composio execute GITHUB_CREATE_AN_ISSUE --data '{"owner":"...","repo":"...","title":"..."}'` |
| Post a Slack message | `composio execute SLACK_SENDS_A_MESSAGE --data '{"channel":"...","text":"..."}'` |
| Create a Notion page | `composio search "create notion page"` → link notion → execute |
| Add a calendar event | `composio search "create calendar event"` → link googlecalendar → execute |

---

## Managing Connections

```bash
# List active connections
composio manage connected-accounts list --status ACTIVE

# Delete a connection
composio manage connected-accounts delete <id>

# List all supported apps
composio manage toolkits list
```

---

## Tips

- **Never guess tool slugs** — always use `composio search` to find exact names
- **All output is JSON** — pipe to `jq` for extraction: `composio manage connected-accounts list | jq -r '.[].id'`
- **For agents**: always pass `--no-wait` to `composio link` and `composio login` to avoid blocking
- **Per-user actions**: pass `--user-id <id>` to `composio execute` for multi-tenant apps
