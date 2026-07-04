/** LangGraph workflow that wires together all incident agent nodes. */

import { StateGraph, START, END } from "@langchain/langgraph";
import { IncidentAnnotation, IncidentState } from "./state";
import { triageNode } from "./nodes/triage";
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
function routeTriage(state: IncidentState): string {
  const severity = state.incident.severity;
  if (severity === Severity.P0 || severity === Severity.P1) {
    return NODE.HUMAN_ESCALATION;
  }
  return NODE.INVESTIGATE;
}

const workflow = new StateGraph(IncidentAnnotation)
  .addNode(NODE.TRIAGE, triageNode)
  .addEdge(START, NODE.TRIAGE)
  .addConditionalEdges(NODE.TRIAGE, routeTriage, {
    [NODE.HUMAN_ESCALATION]: NODE.HUMAN_ESCALATION,
    [NODE.INVESTIGATE]: NODE.INVESTIGATE,
  });
