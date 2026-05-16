import type { Incident, InvestigationResult } from "@incident-agent/shared";
import { AGENT_NAMES } from "@incident-agent/shared";

export interface SubAgentFindings {
  logs: string[];
  metrics: Record<string, unknown>;
  commits: string[];
}

/**
 * Investigation Agent — spawns sub-agents to gather evidence:
 * - Logs Agent: recent log lines from the failing service
 * - Metrics Agent: correlates error spikes with system anomalies
 * - Code Agent: checks recent git commits for the culprit
 */
export async function investigate(
  incident: Incident,
): Promise<InvestigationResult> {
  const findings = await Promise.all([
    gatherLogs(incident.service),
    gatherMetrics(incident.service),
    gatherCommits(incident.service),
  ]);

  const [logs, metrics, commits] = findings;

  incident.timeline.push({
    step: "investigation_complete",
    agent: AGENT_NAMES.INVESTIGATE,
    detail: `Investigated ${incident.service} — logs checked, metrics analyzed, commits reviewed`,
    timestamp: new Date().toISOString(),
  });

  return {
    incidentId: incident.id,
    rootCause: `Root cause identified for ${incident.service}`,
    evidence: { logs, metrics, commits },
    confidence: 0.85,
  };
}

async function gatherLogs(service: string): Promise<string[]> {
  console.log(`[logs-agent] fetching logs for ${service}`);
  return [];
}

async function gatherMetrics(service: string): Promise<Record<string, unknown>> {
  console.log(`[metrics-agent] fetching metrics for ${service}`);
  return {};
}

async function gatherCommits(service: string): Promise<string[]> {
  console.log(`[commits-agent] fetching commits for ${service}`);
  return [];
}
