import { describe, it, expect } from "vitest";
import {
  Severity,
  IncidentStatus,
  type TimeLineEntry,
  type AgentState,
  type Incident,
} from "../types";

const entry: TimeLineEntry = {
  type: "status_change",
  timestamp: "2025-01-01T00:00:00.000Z",
  agent: "triage",
  message: "Incident triaged as P1",
};

const incident: Incident = {
  id: 1,
  title: "test",
  severity: Severity.P1,
  service: "api-gateway",
  status: IncidentStatus.detected,
  events: [],
  timeline: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("TimeLineEntry", () => {
  it("can be created with required fields", () => {
    expect(entry.type).toBe("status_change");
    expect(entry.agent).toBe("triage");
  });

  it("accepts optional data payload", () => {
    const full: TimeLineEntry = { ...entry, data: { severity: "P1" } };
    expect(full.data).toEqual({ severity: "P1" });
  });
});

describe("AgentState", () => {
  it("starts without investigation result", () => {
    const state: AgentState = { incident, status: IncidentStatus.detected };
    expect(state.investigationResult).toBeUndefined();
  });

  it("starts without remediation result", () => {
    const state: AgentState = { incident, status: IncidentStatus.detected };
    expect(state.remediationResult).toBeUndefined();
  });

  it("starts without postMortem", () => {
    const state: AgentState = { incident, status: IncidentStatus.detected };
    expect(state.postMortem).toBeUndefined();
  });

  it("carries incident and status", () => {
    const state: AgentState = { incident, status: IncidentStatus.investigating };
    expect(state.incident.id).toBe(1);
    expect(state.status).toBe(IncidentStatus.investigating);
  });
});
