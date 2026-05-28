# Incident Agent

Multi-agent system that autonomously responds to production incidents — detects alerts, triages severity, investigates root cause, applies remediation, and generates post-mortems.

## Architecture

```
Event Sources → Kafka → LangGraph Workflow → Outputs
                         ├── Triage Agent
                         ├── Investigate Agent
                         ├── Remediate Agent
                         └── Post-Mortem Agent
```

## Tech Stack

- **Next.js** — Dashboard + API routes
- **LangGraph.js** — Agent state machine with Postgres checkpointing
- **Inngest** — Serverless background jobs for agent steps
- **Neon Postgres** — State persistence
- **Qdrant** — Vector memory for cross-incident learning
- **Upstash Kafka** — Event bus for alerts
- **Prometheus/Grafana** — Monitoring
- **Slack** — Notifications



