export const KAFKA_TOPICS = {
  ALERTS: "incident.alerts",
  AGENT_STATUS: "incident.agent.status",
  INCIDENT_UPDATES: "incident.updates",
} as const;

export const AGENT_NAMES = {
  TRIAGE: "triage",
  INVESTIGATE: "investigate",
  REMEDIATE: "remediate",
  POSTMORTEM: "postmortem",
} as const;

export const INCIDENT_STATUSES = [
  "detected",
  "triaged",
  "investigating",
  "remediating",
  "resolved",
] as const;
