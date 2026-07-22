/** Post-mortem node: compiles a final report after remediation and stores it. */
import { IncidentState } from "../state";
import { llm } from "../llm"
import { PostMortem, IncidentStatus } from "@incident-agent/shared";
import { createSlackClient } from "@incident-agent/integrations";

const classifier = llm.withStructuredOutput({
  type: "object",
  properties: {
    rootCause: { type: "string" },
    blastRadius: {
      type: "array",
      items: { type: "string" },
    },
    remediationSteps: {
      type: "array",
      items: { type: "string" },
    },
    lessons: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["rootCause", "blastRadius", "remediationSteps", "lessons"],
})

/** Uses the LLM to generate a post-mortem report, then sends the Slack summary. */
export const postmortemNode = async (state: IncidentState) => {
  const { title, severity, service, createdAt, resolvedAt } = state.incident
  const { rootCause, summary } = state.investigationResult ?? {}
  const remediationAction = state.remediationResult?.action

  const result = await classifier.invoke([
    `Write a post-mortem for a resolved incident.

    Incident: ${title} (${severity})
    Service: ${service}
    Started: ${createdAt}
    Resolved: ${resolvedAt ?? "N/A"}

    Investigation:
    - Root cause: ${rootCause}
    - Summary: ${summary}

    Remediation:
    - Action taken: ${remediationAction}

    Generate a post-mortem with:
    1. Root cause summary
    2. Blast radius (affected services/users)
    3. Remediation steps taken
    4. Lessons learned`,
      ])

  const postMortem: PostMortem = {
    timeline: state.incident.timeline,
    rootCause: result.rootCause,
    blastRadius: result.blastRadius,
    remediationSteps: result.remediationSteps,
    lessons: result.lessons,
  }

  const slack = createSlackClient();
  await slack.sendSummary(state.incident, postMortem);

  return {
    status: "resolved" as IncidentStatus,
    incident: {
      ...state.incident,
      updatedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
    },
    postMortem,
  }
}
