import type { Incident, InvestigationResult } from "@incident-agent/shared";
import { AGENT_NAMES } from "@incident-agent/shared";

/**
 * Post-Mortem Agent — compiles a full incident report after resolution.
 * Stores embedding in Qdrant for future similarity matching.
 */
export async function generatePostMortem(
  incident: Incident,
  investigation: InvestigationResult,
): Promise<string> {
  const report = [
    `# Post-Mortem: ${incident.title}`,
    ``,
    `**Severity:** ${incident.severity}`,
    `**Service:** ${incident.service}`,
    `**Duration:** ${incident.timestamp} → ${incident.resolvedAt ?? "N/A"}`,
    ``,
    `## Timeline`,
    ...incident.timeline.map(
      (e) => `- **${e.step}** (${e.agent}): ${e.detail}`,
    ),
    ``,
    `## Root Cause`,
    investigation.rootCause,
    ``,
    `## Evidence`,
    `- Logs: ${investigation.evidence.logs?.length ?? 0} entries`,
    `- Metrics: ${Object.keys(investigation.evidence.metrics ?? {}).length} data points`,
    `- Commits: ${investigation.evidence.commits?.length ?? 0} reviewed`,
  ].join("\n");

  incident.timeline.push({
    step: "post_mortem_generated",
    agent: AGENT_NAMES.POSTMORTEM,
    detail: "Post-mortem report compiled",
    timestamp: new Date().toISOString(),
  });

  return report;
}
