# AI Incident Response Platform

> **IMPORTANT**: Do not write or edit any code/files without explicit user permission. The user writes all code themselves. You may read files, explain concepts, review code, and answer questions, but never create or modify files unless told otherwise.

> Multi-agent system that autonomously responds to production incidents — detects alerts, triages severity, investigates root cause, applies remediation, and generates post-mortems.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Event Sources                         │
│  Prometheus Alert │ Grafana Webhook │ Datadog │ Custom  │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│   Upstash Kafka       │  Event bus — all alerts stream here
│   (Event Stream)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────┐
│              LangGraph.js Agent Workflow               │
│                                                       │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐        │
│  │ Triage  │─▶│Investigate│─▶│  Remediate   │        │
│  │ Agent   │  │ Agent(s)  │  │   Agent      │        │
│  └─────────┘  └──────────┘  └──────┬───────┘        │
│       │                            │                  │
│       ▼                            ▼                  │
│  ┌─────────┐                ┌──────────────┐        │
│  │  Human  │                │  Post-Mortem │        │
│  │  Esc.   │                │   Agent      │        │
│  └─────────┘                └──────────────┘        │
│                                                       │
│  State persisted to: Neon Postgres (via checkpointer) │
└──────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────┐
│                   Outputs                           │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐  │
│  │Dashboard │ │Slack    │ │Post-mortem│ │Qdrant │  │
│  │(Next.js) │ │Alerts   │ │Report    │ │Memory │  │
│  └──────────┘ └─────────┘ └──────────┘ └───────┘  │
└────────────────────────────────────────────────────┘
```

---

## Tech Stack

### App Layer
| Tool | Role |
|------|------|
| **Next.js** | API routes (serverless functions) + real-time incident dashboard |
| **TypeScript** | Full type safety across agents, API, and frontend |

### Agent Orchestration
| Tool | Role |
|------|------|
| **LangGraph.js** | State machine for incident lifecycle. Each incident moves through: `detected → triaged → investigating → remediating → resolved`. Checkpoints to Postgres for cold-start resilience. |
| **Inngest** | Serverless background jobs. Each agent step is an Inngest function — handles timeouts, retries, step rate-limiting without managing a queue. |

### Storage
| Tool | Role |
|------|------|
| **Neon (Serverless Postgres)** | LangGraph checkpoint state, incident records, user data |
| **Qdrant Cloud** | Vector memory — stores past incidents for similarity lookup. When a new alert fires, triage agent queries: "has this happened before?" |
| **Upstash Redis** | Caching + pub/sub. Real-time agent status updates pushed to the dashboard. |

### Event Bus
| Tool | Role |
|------|------|
| **Upstash Kafka** | Serverless event stream. Monitoring alerts land here → triggers LangGraph workflow. Each agent publishes status updates back to Kafka. |

### Monitoring & Outputs
| Tool | Role |
|------|------|
| **Prometheus + Grafana** | Track agent performance — triage latency, false positive rate, mean-time-to-remediate |
| **Slack Webhooks** | Incident notifications, escalation alerts, remediation summaries |

### Deploy
| Tool | Role |
|------|------|
| **Vercel** | Serverless deploy — Next.js API routes + Inngest functions run here. Zero infra management. |
| **Docker** | Local development environment |

---

## Agent Workflow Detail

### 1. Triage Agent
- **Trigger:** Kafka event from monitoring alert
- **Action:** Classifies severity (P0-P4), extracts service name, error type, timestamp
- **Memory:** Queries Qdrant for similar past incidents → retrieves historical context
- **Outputs:** Incident record created in Postgres, dashboard updated, Slack notification sent
- **Decision:** P0/P1 → escalate to human + begin investigation. P2-P4 → fully autonomous

### 2. Investigation Agent (spawns sub-agents)
- **Logs Agent:** Queries recent log lines from the failing service
- **Metrics Agent:** Correlates error spike with recent deploys, CPU/memory anomalies
- **Code Agent:** Checks recent git commits to the service, identifies likely culprit
- **Outputs:** Root cause summary with evidence (log snippets, metric charts, commit links)

### 3. Remediation Agent
- **Action:** Suggests/applies fixes based on incident type
- **Patterns:** Rollback deploy, scale up replicas, restart service, adjust config
- **Human-in-loop:** For P0/P1 → proposes fix, waits for approval. For lower severity → auto-applies
- **Outputs:** Remediation report, status update to dashboard

### 4. Post-Mortem Agent
- **Trigger:** Incident resolved
- **Action:** Compiles full timeline, root cause, remediation steps, blast radius
- **Memory:** Stores embedding in Qdrant for future incident similarity matching
- **Outputs:** Markdown post-mortem, Slack summary, dashboard timeline entry

---

## Key Design Decisions

**Why LangGraph.js over a simple loop:**
Incidents have branching paths — an investigation might spawn 3 parallel sub-agents, a remediation might need human approval, a P0 might skip triage entirely. LangGraph models this as a state machine with checkpoint/resume, which is impossible to do cleanly with a simple `while` loop.

**Why Inngest over Celery:**
Serverless-native. No queue infrastructure to manage. Each agent step runs as an Inngest function with built-in retries, rate limiting, and the ability to run for minutes without a dedicated worker. Integrates directly with Next.js — same codebase, one deploy.

**Why Qdrant for incident memory:**
When a P1 fires at 3 AM, the triage agent shouldn't start from scratch. Qdrant stores embeddings of every past incident — similar symptoms, similar root causes, what fixed it last time. Turns incidents into a retrieval problem, not a reasoning problem.

**Why Kafka:**
Decouples alert sources from the agent system. Prometheus, Datadog, Grafana, custom webhooks — they all publish to one topic. Agents subscribe and process. If the agent system is down for a minute, alerts queue up in Kafka and drain when it's back.

---

## Data Flow

```
1. Prometheus fires alert: "latency_p99 > 500ms on api-gateway"
2. Kafka receives event → triggers Inngest function
3. Triage agent: severity=P1, service=api-gateway, starts investigation
4. Investigation agent spawns 3 sub-agents (parallel):
   - Checks logs: "error: connection pool exhausted"
   - Checks metrics: "CPU at 95%, connections at 100%"
   - Checks git: "deploy 15min ago — 'increase connection pool size' fix was reverted"
5. Root cause identified: connection pool too small for traffic spike
6. Remediation agent: scales up replicas + increases pool size → applies
7. Incident resolved (15 min total)
8. Post-mortem agent writes report, stores embedding in Qdrant
9. Dashboard shows full timeline. Slack: "Incident #42 resolved — root cause: connection pool exhaustion"
```

---

## Competitive Differentiation

| Aspect | This project | Typical alternative |
|--------|-------------|-------------------|
| Orchestration | LangGraph state machine with persistence | Linear agent scripts |
| Background work | Inngest (serverless) | Celery + Redis (infra to manage) |
| Incident memory | Qdrant vector search | No cross-incident learning |
| Deployment | Vercel (zero infra) | Kubernetes cluster |
| Tech stack | TypeScript end-to-end | Python agents + separate frontend |

---

## Project Structure

```
incident-agent/
├── apps/
│   ├── nextjs/           # Next.js app — dashboard + API routes
│   │   ├── app/api/      # Serverless API endpoints
│   │   ├── app/dashboard # Incident timeline UI
│   │   └── inngest/      # Inngest function definitions
│   └── agents/           # LangGraph agent definitions
│       ├── triage/
│       ├── investigate/
│       ├── remediate/
│       └── postmortem/
├── packages/
│   ├── shared/           # Types, schemas, constants
│   ├── memory/           # Qdrant client + embedding logic
│   └── integrations/     # Kafka, Slack, GitHub, Prometheus clients
├── docker-compose.yml    # Local dev environment
└── package.json
```
