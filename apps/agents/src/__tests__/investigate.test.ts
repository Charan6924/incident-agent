import { describe, it, expect, beforeEach, vi } from "vitest";
import { investigateNode } from "../nodes/investigate";
import type { IncidentState } from "../state";
import { Severity, IncidentStatus } from "@incident-agent/shared";

const mockToolInvoke = vi.hoisted(() => vi.fn());
const mockClassifierInvoke = vi.hoisted(() => vi.fn());

vi.mock("../llm", () => ({
  llm: {
    bindTools: vi.fn().mockReturnValue({ invoke: mockToolInvoke }),
    withStructuredOutput: vi.fn().mockReturnValue({ invoke: mockClassifierInvoke }),
  },
}));

const baseState = {
  incident: {
    id: 1,
    title: "CPU spike",
    severity: Severity.P1,
    service: "api-gateway",
    status: IncidentStatus.triaged,
    events: [
      {
        id: 1,
        source: "prometheus",
        title: "CPU threshold breach",
        message: "CPU > 90% for 5 minutes",
        severity: Severity.P1,
        service: "api-gateway",
        timestamp: "2025-01-01T00:00:00.000Z",
      },
    ],
    timeline: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  status: IncidentStatus.triaged,
} as IncidentState;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("investigateNode", () => {
  it("returns status investigating", async () => {
    mockToolInvoke.mockResolvedValue({ content: "Found high CPU in logs" });
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "Connection pool exhausted",
      evidence: ["CPU at 95%", "connections at 100%"],
      confidence: 0.9,
      summary: "Connection pool too small for traffic spike",
    });

    const result = await investigateNode(baseState);

    expect(result.status).toBe("investigating");
  });

  it("produces an investigation result", async () => {
    mockToolInvoke.mockResolvedValue({ content: "Found high CPU in logs" });
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "Connection pool exhausted",
      evidence: ["CPU at 95%", "connections at 100%"],
      confidence: 0.9,
      summary: "Connection pool too small for traffic spike",
    });

    const result = await investigateNode(baseState);

    expect(result.investigationResult).toBeDefined();
    expect(result.investigationResult.rootCause).toBe("Connection pool exhausted");
    expect(result.investigationResult.confidence).toBe(0.9);
    expect(result.investigationResult.evidence).toHaveLength(2);
  });

  it("handles low-confidence findings", async () => {
    mockToolInvoke.mockResolvedValue({ content: "No clear cause found" });
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "Unknown",
      evidence: ["Insufficient data"],
      confidence: 0.2,
      summary: "Could not determine root cause",
    });

    const result = await investigateNode(baseState);

    expect(result.investigationResult.confidence).toBe(0.2);
    expect(result.investigationResult.rootCause).toBe("Unknown");
  });
});
