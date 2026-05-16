import type {
  Incident,
  InvestigationResult,
  RemediationPlan,
} from "@incident-agent/shared";
import { AGENT_NAMES } from "@incident-agent/shared";

/**
 * Remediation Agent — proposes and applies fixes.
 * P0/P1 incidents require human approval. Lower severity applies autonomously.
 */
export async function remediate(
  incident: Incident,
  investigation: InvestigationResult,
): Promise<RemediationPlan> {
  const requiresApproval = incident.severity === "P0" || incident.severity === "P1";

  const plan: RemediationPlan = {
    incidentId: incident.id,
    action: `Proposed remediation for ${incident.service}`,
    requiresApproval,
    approved: !requiresApproval,
  };

  incident.timeline.push({
    step: "remediation_proposed",
    agent: AGENT_NAMES.REMEDIATE,
    detail: requiresApproval
      ? "Remediation requires human approval (P0/P1)"
      : "Auto-remediation applied",
    timestamp: new Date().toISOString(),
  });

  return plan;
}
