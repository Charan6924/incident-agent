# Incident Agent

Multi-agent system that autonomously responds to production incidents — detects alerts, triages severity, investigates root cause, applies remediation, and generates post-mortems. Built with LangGraph.js and the DeepSeek V4 Flash LLM.

## Architecture

```
Event Sources (Prometheus / Grafana / Datadog / Custom)
        │
        ▼
┌──────────────────┐     ┌──────────────────────────┐
│   Upstash Kafka   │────▶│   LangGraph.js Workflow   │
│   (Event Stream)  │     │                           │
└──────────────────┘     │  ┌────────┐ ┌──────────┐  │
                         │  │ Triage  │▶│Investigate│  │
                         │  └───┬────┘ └────┬─────┘  │
                         │      │           │         │
                         │  ┌───▼────┐ ┌────▼─────┐  │
                         │  │ Human  │ │ Remediate │  │
                         │  │ Esc.   │ │           │  │
                         │  └────────┘ └────┬─────┘  │
                         │                  │         │
                         │           ┌──────▼──────┐ │
                         │           │ Post-Mortem  │ │
                         │           └─────────────┘ │
                         └──────────────────────────┘
                                    │
                         ┌──────────┼──────────┐
                         ▼          ▼          ▼
                   ┌────────┐ ┌────────┐ ┌──────────┐
                   │ Slack  │ │Qdrant  │ │Dashboard │
                   │ Alerts │ │Memory  │ │(Next.js) │
                   └────────┘ └────────┘ └──────────┘
```

### Agent Workflow

Each incident moves through 5 nodes in a LangGraph state machine:

| Node | What it does |
|------|-------------|
| **Triage** | Classifies severity (P0-P4), extracts service/error type, notifies Slack. Routes P0/P1 to human escalation, P2-P4 to autonomous investigation. |
| **Investigate** | Uses tool-calling LLM to query Prometheus metrics and GitHub git history. Returns root cause with evidence. |
| **Remediate** | Takes investigation results and applies fixes — rollback Vercel deployments, revert commits, create PRs, merge fixes. |
| **Post-Mortem** | Generates a structured post-mortem report via LLM, stores it, and sends a Slack summary. |
| **Human Escalation** | Sends Slack @here alert for P0/P1 incidents or when remediation needs approval. |

### Conditional Routing

- **Triage → Investigate** if severity is P2-P4 (autonomous)
- **Triage → Human Escalation** if severity is P0-P1 (needs human)
- **Remediate → Post-Mortem** if fix was auto-applied
- **Remediate → Human Escalation** if fix needs approval

## Project Structure

```
incident-agent/
├── apps/
│   ├── agents/                 # LangGraph agent definitions
│   │   └── src/
│   │       ├── index.ts        # Compiled graph export
│   │       ├── graph.ts        # StateGraph assembly + edges
│   │       ├── state.ts        # Annotation.Root state definition
│   │       ├── llm.ts          # DeepSeek V4 Flash client
│   │       ├── edges.ts        # Conditional routing functions
│   │       └── nodes/
│   │           ├── triage.ts
│   │           ├── investigate.ts
│   │           ├── remediate.ts
│   │           ├── postmortem.ts
│   │           └── human_escalation.ts
│   └── nextjs/                 # Dashboard + API routes
├── packages/
│   ├── shared/                 # Types, schemas, constants
│   │   └── src/types.ts        # Enums, interfaces, shared types
│   ├── integrations/           # External service clients
│   │   └── src/
│   │       ├── slack.ts        # Slack webhook notifications
│   │       ├── github.ts       # Octokit GitHub client
│   │       ├── vercel.ts       # Vercel deployment API
│   │       ├── upstash.ts      # Kafka producer/consumer
│   │       └── prometheus.ts   # Prometheus query client
│   └── memory/                 # Qdrant vector storage
├── docker-compose.yml
├── package.json                # pnpm workspace root
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Tool |
|-------|------|
| **LLM** | DeepSeek V4 Flash (via OpenAI-compatible API) |
| **Agents** | LangGraph.js with checkpointer |
| **Workflow** | Inngest (serverless background jobs) |
| **Backend** | Next.js API routes |
| **Database** | Neon (serverless Postgres) |
| **Vector Store** | Qdrant Cloud |
| **Event Bus** | Upstash Kafka |
| **Cache** | Upstash Redis |
| **Monitoring** | Prometheus + Grafana |
| **Notificiations** | Slack webhooks |
| **Infra** | Vercel (serverless deploy) |
| **Package** | pnpm workspaces |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for local Kafka/Redis)

### Install

```bash
pnpm install
```

### Environment Variables

Create `.env` in each app package:

```env
# LLM
DEEPSEEK_API_KEY=

# Slack
SLACK_WEBHOOK_URL=
SLACK_ESCALATION_WEBHOOK_URL=

# GitHub
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=

# Vercel
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# Kafka
UPSTASH_KAFKA_URL=
UPSTASH_KAFKA_USERNAME=
UPSTASH_KAFKA_PASSWORD=

# Prometheus
PROMETHEUS_HOST=

# Qdrant
QDRANT_URL=
QDRANT_API_KEY=
```

### Build

```bash
pnpm build
```

### Dev

```bash
pnpm dev
```

## State Shape

The LangGraph state machine uses `Annotation.Root` with these channels:

```typescript
{
  incident: Incident,              // Alert details, timeline, severity
  status: IncidentStatus,          // detected → triaged → investigating → remediated → resolved
  investigationResult?: InvestigationResult,  // Root cause, evidence, confidence
  remediationResult?: RemediationResult,      // Action taken, status
  postMortem?: PostMortem,         // Final report
}
```

## Integration Clients

### GitHub (`createGitHubClient`)
- `getRecentCommits(service, since)` — List recent commits affecting a service path
- `getCommitDiff(sha)` — Get files changed in a commit
- `createBranch(name, fromSha?)` — Create a new branch
- `createPR(head, base, title, body)` — Open a pull request
- `mergePR(number, method)` — Merge a PR
- `createRevertPR(commitSha, baseBranch)` — Create a revert PR for a bad commit

### Vercel (`createVercelClient`)
- `listDeployments(project)` — List recent deployments
- `rollbackDeployment(id)` — Rollback to a previous deployment
- `createDeployment(project, ref)` — Trigger a new deploy

### Slack (`createSlackClient`)
- `sendAlert(incident)` — Notify channel about new incident
- `sendEscalation(incident)` — @here alert for P0/P1
- `sendSummary(incident, postMortem)` — Post resolution summary

### Prometheus (`createPrometheusClient`)
- `query(promql)` — Run a PromQL query
- `queryRange(promql, start, end, step)` — Range query
- `getAlertStatus()` — List current firing alerts

### Upstash Kafka (`createKafkaClient`)
- `publishEvent(event)` — Publish an incident event
- `subscribeToAlerts(handler)` — Subscribe to the alerts topic
