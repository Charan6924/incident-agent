/** LangGraph workflow that wires together all incident agent nodes. */

import { StateGraph, START, END } from "@langchain/langgraph";
import { IncidentAnnotation, IncidentState } from "./state";
import { triageNode } from "./nodes/triage";
import { humanEscalationNode } from "./nodes/human_escalation";
import { investigateNode } from "./nodes/investigate";
import { remediateNode } from "./nodes/remediate";
import { postmortemNode } from "./nodes/postmortem";
import { Severity } from "@incident-agent/shared";

export const NODE = {
  TRIAGE: "triage",
  INVESTIGATE: "investigate",
  REMEDIATE: "remediate",
  HUMAN_ESCALATION: "human_escalation",
  POSTMORTEM: "postmortem",
} as const;

/**
 * Routes after triage based on classified severity.
 * P0/P1 → human escalation + investigation.
 * P2-P4 → investigation only (autonomous).
 */
export function routeTriage(state: IncidentState): string {
  const severity = state.incident.severity;
  if (severity === Severity.P0 || severity === Severity.P1) {
    return NODE.HUMAN_ESCALATION;
  }
  return NODE.INVESTIGATE;
}

const workflow = new StateGraph(IncidentAnnotation)
  .addNode(NODE.TRIAGE, triageNode)
  .addNode(NODE.HUMAN_ESCALATION, humanEscalationNode)
  .addNode(NODE.INVESTIGATE, investigateNode)
  .addNode(NODE.REMEDIATE, remediateNode)
  .addNode(NODE.POSTMORTEM, postmortemNode)
  .addEdge(START, NODE.TRIAGE)
  .addConditionalEdges(NODE.TRIAGE, routeTriage, {
    [NODE.HUMAN_ESCALATION]: NODE.HUMAN_ESCALATION,
    [NODE.INVESTIGATE]: NODE.INVESTIGATE,
  })
  .addEdge(NODE.HUMAN_ESCALATION, NODE.INVESTIGATE)
  .addEdge(NODE.INVESTIGATE, NODE.REMEDIATE)
  .addEdge(NODE.REMEDIATE, NODE.POSTMORTEM)
  .addEdge(NODE.POSTMORTEM, END);

/** Compiled LangGraph workflow ready for invocation. */
export const graph = workflow.compile();

/**
 * Convenience wrapper: invokes the full incident workflow from start to finish.
 * Accepts a raw incident, seeds the initial state, and returns the final state
 * after the workflow reaches END.
 */
export async function runWorkflow(state: IncidentState): Promise<IncidentState> {
  return await graph.invoke(state);
}
