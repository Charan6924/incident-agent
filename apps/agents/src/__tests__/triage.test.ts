import { describe, it, expect, beforeEach, vi } from "vitest";
import { triageNode } from "../nodes/triage";
import type { IncidentState } from "../state";
import { Severity, IncidentStatus } from "@incident-agent/shared";

const mockInvoke = vi.hoisted(() => vi.fn());

vi.mock("../llm", () => ({
  llm: {
    withStructuredOutput: vi.fn().mockReturnValue({ invoke: mockInvoke }),
  },
}));

const baseState = {
  incident: {
    id: 1,
    title: "CPU spike",
    severity: Severity.P0,
    service: "api-gateway",
    status: IncidentStatus.detected,
    events: [
      {
        id: 1,
        source: "prometheus",
        title: "CPU threshold breach",
        message: "CPU > 90% for 5 minutes",
        severity: Severity.P0,
        service: "api-gateway",
        timestamp: "2025-01-01T00:00:00.000Z",
      },
    ],
    timeline: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  status: IncidentStatus.detected,
} as IncidentState;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("triageNode", () => {
  it("classifies severity from alert message", async () => {
    mockInvoke.mockResolvedValue({ severity: "P1", title: "CPU spike", summary: "High CPU on API gateway" });

    const result = await triageNode(baseState);

    expect(result.status).toBe("triaged");
    expect(result.incident.severity).toBe(Severity.P1);
  });

  it("updates the incident title", async () => {
    mockInvoke.mockResolvedValue({ severity: "P1", title: "Refined: CPU spike", summary: "High CPU" });

    const result = await triageNode(baseState);

    expect(result.incident.title).toBe("Refined: CPU spike");
  });

  it("preserves existing incident fields", async () => {
    mockInvoke.mockResolvedValue({ severity: "P2", title: "CPU spike", summary: "Medium CPU" });

    const result = await triageNode(baseState);

    expect(result.incident.id).toBe(1);
    expect(result.incident.service).toBe("api-gateway");
  });

  it("handles P0 critical severity", async () => {
    mockInvoke.mockResolvedValue({ severity: "P0", title: "CRITICAL: full outage", summary: "Full outage" });

    const result = await triageNode(baseState);

    expect(result.incident.severity).toBe(Severity.P0);
  });
});
