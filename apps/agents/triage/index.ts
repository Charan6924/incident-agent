import type { AlertEvent, Incident } from "@incident-agent/shared";
import { AGENT_NAMES } from "@incident-agent/shared";

/**
 * Triage Agent — classifies incoming alerts and creates incident records.
 * Queries Qdrant for similar past incidents to inform severity scoring.
 */
export async function triageAlert(event: AlertEvent): Promise<Incident> {
  const incident: Incident = {
    id: crypto.randomUUID(),
    title: `[${event.severity}] ${event.service}: ${event.errorType}`,
    severity: event.severity,
    status: "triaged",
    service: event.service,
    errorType: event.errorType,
    description: event.description,
    timestamp: event.timestamp,
    timeline: [
      {
        step: "alert_received",
        agent: AGENT_NAMES.TRIAGE,
        detail: `Alert received from ${event.source}`,
        timestamp: event.timestamp,
      },
    ],
  };

  return incident;
}
