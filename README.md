# Incident Agent

Multi-agent system that autonomously responds to production incidents — detects alerts, triages severity, investigates root cause, applies remediation, and generates post-mortems. Built with LangGraph.js and the DeepSeek V4 Flash LLM.

## Architecture

```
POST /api/incidents (or Kafka event)
        │
        ▼
┌────────────────────────────┐
│        Inngest              │
│  Durable execution pipeline │
│                             │
│  step.run("triage")         │
│  step.run("investigate")    │
│  step.waitForEvent(approve) │
│  step.run("remediate")      │
│  step.run("postmortem")     │
└──────────┬─────────────────┘
           │
           ▼
┌──────────────────────────┐
│  LangGraph.js Workflow    │
│  (agent state machine)    │
│                           │
│  ┌────────┐ ┌──────────┐ │
│  │ Triage  │▶│Investigate│ │
│  └───┬────┘ └────┬─────┘ │
│      │           │       │
│  ┌───▼────┐ ┌────▼─────┐ │
│  │ Human  │ │ Remediate │ │
│  │ Esc.   │ │           │ │
│  └────────┘ └────┬─────┘ │
│                  │       │
│           ┌──────▼──────┐│
│           │ Post-Mortem  ││
│           └─────────────┘│
└──────────────────────────┘
         │
         └──────────┬──────────┐
                    ▼          ▼
              ┌────────┐ ┌──────────┐
              │ Slack  │ │Dashboard │
              │ Alerts │ │(Next.js) │
              └────────┘ └──────────┘
```

### Pipeline

Incidents flow through an **Inngest** durable execution pipeline with 5 stages,
each wrapping the corresponding LangGraph node:

| Stage | Engine | What it does |
|-------|--------|-------------|
| **Triage** | Inngest `step.run()` | Classifies severity (P0-P4), extracts service/error type. Routes to escalation if critical. |
| **Investigate** | Inngest `step.run()` | Uses tool-calling LLM to query Prometheus metrics and GitHub git history. Returns root cause with evidence. |
| **Human Approval** | Inngest `step.waitForEvent()` | Pauses pipeline — waits for an `incident/human-approved` event with a 10-minute timeout before proceeding to remediation. |
| **Remediate** | Inngest `step.run()` | Takes investigation results and applies fixes — rollback Vercel deployments, revert commits, create PRs, merge fixes. |
| **Post-Mortem** | Inngest `step.run()` | Generates a structured post-mortem report via LLM and sends a Slack summary. |

If any `step.run()` fails, Inngest retries from that step — no re-execution of
prior stages. See `apps/nextjs/inngest/processEvent.ts`.

## Project Structure

```
incident-agent/
├── apps/
│   ├── agents/                 # LangGraph agent definitions
│   │   └── src/
│   │       ├── index.ts        # Package exports
│   │       ├── workflow.ts     # StateGraph assembly + edges
│   │       ├── state.ts        # Annotation.Root state definition
│   │       ├── llm.ts          # DeepSeek V4 Flash client
│   │       └── nodes/
│   │           ├── triage.ts
│   │           ├── investigate.ts
│   │           ├── remediate.ts
│   │           ├── postmortem.ts
│   │           └── human_escalation.ts
│   └── nextjs/                 # Dashboard + API + Inngest
│       ├── app/
│       │   └── api/
│       │       ├── incidents/route.ts   # POST — sends Inngest event
│       │       └── inngest/route.ts     # Inngest serve handler
│       └── inngest/
│           ├── client.ts           # Inngest client + event schemas
│           └── processEvent.ts     # Durable pipeline definition
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
| **Notifications** | Slack webhooks |
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

Terminal 1 — Next.js dev server:

```bash
pnpm dev
```

Terminal 2 — Inngest dev server (dashboard at `localhost:8288`):

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Send a test incident:

```bash
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"source":"test","title":"High latency","message":"p99 > 500ms","service":"api-gateway"}'
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
- `query(promql)` — Run a PromQL instant query
- `queryRange(promql, start, end, step)` — Range query

### Upstash Kafka (`createKafkaClient`)
- `publish(event)` — Publish an incident event to the alerts topic
