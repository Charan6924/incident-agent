import { describe, it, expect, beforeEach, vi } from "vitest";
import { postmortemNode } from "../nodes/postmortem";
import type { IncidentState } from "../state";
import { Severity, IncidentStatus } from "@incident-agent/shared";

const mockClassifierInvoke = vi.hoisted(() => vi.fn());
const mockSendSummary = vi.hoisted(() => vi.fn());

vi.mock("../llm", () => ({
  llm: {
    withStructuredOutput: vi.fn().mockReturnValue({ invoke: mockClassifierInvoke }),
  },
}));

vi.mock("@incident-agent/integrations", () => ({
  createSlackClient: vi.fn().mockReturnValue({ sendSummary: mockSendSummary }),
}));

const baseState = {
  incident: {
    id: 1,
    title: "CPU spike",
    severity: Severity.P1,
    service: "api-gateway",
    status: "remediated" as IncidentStatus,
    events: [],
    timeline: [
      { type: "status_change", timestamp: "t1", agent: "triage", message: "triaged" },
      { type: "status_change", timestamp: "t2", agent: "investigate", message: "found cause" },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:30:00.000Z",
    resolvedAt: "2025-01-01T00:30:00.000Z",
  },
  status: "remediated" as IncidentStatus,
  investigationResult: {
    rootCause: "Connection pool exhausted",
    evidence: ["CPU at 95%"],
    confidence: 0.9,
    summary: "Pool too small for traffic spike",
  },
  remediationResult: {
    action: "increased pool size",
    status: "applied" as const,
  },
} as unknown as IncidentState;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("postmortemNode", () => {
  it("returns resolved status", async () => {
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "Connection pool exhaustion",
      blastRadius: ["api-gateway"],
      remediationSteps: ["increase pool size"],
      lessons: ["monitor pool usage"],
    });
    mockSendSummary.mockResolvedValue(undefined);

    const result = await postmortemNode(baseState);

    expect(result.status).toBe("resolved");
  });

  it("generates a post-mortem report", async () => {
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "Connection pool exhaustion under load",
      blastRadius: ["api-gateway", "user-service"],
      remediationSteps: ["increase pool size", "add auto-scaling"],
      lessons: ["monitor connection pool", "add scaling alerts"],
    });
    mockSendSummary.mockResolvedValue(undefined);

    const result = await postmortemNode(baseState);

    expect(result.postMortem).toBeDefined();
    expect(result.postMortem.rootCause).toBe("Connection pool exhaustion under load");
    expect(result.postMortem.blastRadius).toContain("api-gateway");
    expect(result.postMortem.remediationSteps).toHaveLength(2);
    expect(result.postMortem.lessons).toHaveLength(2);
  });

  it("includes the incident timeline in the report", async () => {
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "test",
      blastRadius: [],
      remediationSteps: [],
      lessons: [],
    });
    mockSendSummary.mockResolvedValue(undefined);

    const result = await postmortemNode(baseState);

    expect(result.postMortem.timeline).toHaveLength(2);
  });

  it("sends summary to Slack", async () => {
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "Connection pool exhaustion",
      blastRadius: ["api-gateway"],
      remediationSteps: ["increase pool size"],
      lessons: ["monitor pool usage"],
    });
    mockSendSummary.mockResolvedValue(undefined);

    await postmortemNode(baseState);

    expect(mockSendSummary).toHaveBeenCalledOnce();
  });

  it("sets resolvedAt timestamp", async () => {
    mockClassifierInvoke.mockResolvedValue({
      rootCause: "test",
      blastRadius: [],
      remediationSteps: [],
      lessons: [],
    });
    mockSendSummary.mockResolvedValue(undefined);

    const result = await postmortemNode(baseState);

    expect(result.incident.resolvedAt).toBeDefined();
  });
});
