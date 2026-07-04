/** LangGraph workflow that wires together all incident agent nodes. */

import { StateGraph, START, END } from "@langchain/langgraph";
import { IncidentAnnotation } from "./state";

export const NODE = {
  TRIAGE: "triage",
  INVESTIGATE: "investigate",
  REMEDIATE: "remediate",
  HUMAN_ESCALATION: "human_escalation",
  POSTMORTEM: "postmortem",
} as const;

const workflow = new StateGraph(IncidentAnnotation);
