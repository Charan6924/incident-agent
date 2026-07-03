import { describe, it, expect } from "vitest";
import { Severity, IncidentStatus, type IncidentEvent, type Incident } from "../types";

const validEvent: IncidentEvent = {
  id: 1,
  source: "prometheus",
  title: "CPU threshold breach",
  message: "CPU > 90% for 5min",
  severity: Severity.P1,
  service: "api-gateway",
  timestamp: "2025-01-01T00:00:00.000Z",
};

const validIncident: Incident = {
  id: 1,
  title: "CPU threshold breach",
  severity: Severity.P1,
  service: "api-gateway",
  status: IncidentStatus.detected,
  events: [validEvent],
  timeline: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("IncidentEvent", () => {
  it("can be created with required fields", () => {
    expect(validEvent.id).toBe(1);
    expect(validEvent.source).toBe("prometheus");
    expect(validEvent.severity).toBe(Severity.P1);
  });

  it("accepts optional metadata", () => {
    const withMeta: IncidentEvent = { ...validEvent, metadata: { region: "us-east-1" } };
    expect(withMeta.metadata).toEqual({ region: "us-east-1" });
  });

  it("can have any severity level", () => {
    for (const s of [Severity.P0, Severity.P1, Severity.P2, Severity.P3, Severity.P4]) {
      const ev: IncidentEvent = { ...validEvent, severity: s, id: s.charCodeAt(1) };
      expect(ev.severity).toBe(s);
    }
  });
});

describe("Incident", () => {
  it("can be created with required fields", () => {
    expect(validIncident.id).toBe(1);
    expect(validIncident.status).toBe(IncidentStatus.detected);
  });

  it("starts with empty timeline", () => {
    expect(validIncident.timeline).toEqual([]);
  });

  it("tracks severity and service", () => {
    expect(validIncident.severity).toBe(Severity.P1);
    expect(validIncident.service).toBe("api-gateway");
  });

  it("sets resolvedAt only when resolved", () => {
    expect(validIncident.resolvedAt).toBeUndefined();
    const resolved: Incident = { ...validIncident, resolvedAt: "2025-01-01T01:00:00.000Z" };
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("holds multiple events", () => {
    const e2: IncidentEvent = { ...validEvent, id: 2, message: "Second alert" };
    const multi: Incident = { ...validIncident, events: [validEvent, e2] };
    expect(multi.events).toHaveLength(2);
  });
});
