/** Human escalation node: sends a Slack @here alert for P0/P1 or approval-needed incidents. */
import { IncidentState } from "../state";
import { createSlackClient } from "@incident-agent/integrations";

/** Sends a Slack @here escalation and pauses the workflow for human intervention. */
export const humanEscalationNode = async (state: IncidentState) => {
  const slack = createSlackClient();
  await slack.sendEscalation(state.incident);

  return {
    status: "detected" as const,
    incident: {
      ...state.incident,
      updatedAt: new Date().toISOString(),
    },
  };
};
