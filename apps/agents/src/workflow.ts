/** LangGraph workflow that wires together all incident agent nodes. */

import { StateGraph, START, END } from "@langchain/langgraph";
import { IncidentAnnotation } from "./state";
import { triageNode } from "./nodes/triage";

export const NODE = {
  TRIAGE: "triage",
  INVESTIGATE: "investigate",
  REMEDIATE: "remediate",
  HUMAN_ESCALATION: "human_escalation",
  POSTMORTEM: "postmortem",
} as const;

const workflow = new StateGraph(IncidentAnnotation)
  .addNode(NODE.TRIAGE, triageNode)
  .addEdge(START, NODE.TRIAGE);
