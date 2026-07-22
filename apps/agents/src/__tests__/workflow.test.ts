import { describe, it, expect } from "vitest";
import { graph, NODE, routeTriage } from "../workflow";
import { Severity } from "@incident-agent/shared";
import type { IncidentState } from "../state";

const fullState = {
  incident: {
    id: 1,
    title: "test",
    severity: Severity.P0,
    service: "api",
    status: "detected" as const,
    events: [],
    timeline: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  status: "detected" as const,
} as unknown as IncidentState;

describe("routeTriage", () => {
  it("routes P0 to human escalation", () => {
    const state = { ...fullState, incident: { ...fullState.incident, severity: Severity.P0 } };
    expect(routeTriage(state)).toBe(NODE.HUMAN_ESCALATION);
  });

  it("routes P1 to human escalation", () => {
    const state = { ...fullState, incident: { ...fullState.incident, severity: Severity.P1 } };
    expect(routeTriage(state)).toBe(NODE.HUMAN_ESCALATION);
  });

  it("routes P2 to investigation", () => {
    const state = { ...fullState, incident: { ...fullState.incident, severity: Severity.P2 } };
    expect(routeTriage(state)).toBe(NODE.INVESTIGATE);
  });

  it("routes P3 to investigation", () => {
    const state = { ...fullState, incident: { ...fullState.incident, severity: Severity.P3 } };
    expect(routeTriage(state)).toBe(NODE.INVESTIGATE);
  });

  it("routes P4 to investigation", () => {
    const state = { ...fullState, incident: { ...fullState.incident, severity: Severity.P4 } };
    expect(routeTriage(state)).toBe(NODE.INVESTIGATE);
  });
});

describe("workflow graph", () => {
  it("compiles without error", () => {
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe("function");
  });
});
