import { describe, it, expect, beforeEach, vi } from "vitest";
import { humanEscalationNode } from "../nodes/human_escalation";
import type { IncidentState } from "../state";
import { Severity, IncidentStatus } from "@incident-agent/shared";

const mockSendEscalation = vi.hoisted(() => vi.fn());

vi.mock("@incident-agent/integrations", () => ({
  createSlackClient: vi.fn().mockReturnValue({ sendEscalation: mockSendEscalation }),
}));

const baseState = {
  incident: {
    id: 1,
    title: "CRITICAL: full outage",
    severity: Severity.P0,
    service: "api-gateway",
    status: IncidentStatus.detected,
    events: [],
    timeline: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  status: IncidentStatus.detected,
} as unknown as IncidentState;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("humanEscalationNode", () => {
  it("sends a Slack escalation", async () => {
    mockSendEscalation.mockResolvedValue(undefined);

    await humanEscalationNode(baseState);

    expect(mockSendEscalation).toHaveBeenCalledOnce();
  });

  it("passes the incident to Slack", async () => {
    mockSendEscalation.mockResolvedValue(undefined);

    await humanEscalationNode(baseState);

    expect(mockSendEscalation).toHaveBeenCalledWith(baseState.incident);
  });

  it("returns detected status and updated timestamp", async () => {
    mockSendEscalation.mockResolvedValue(undefined);

    const result = await humanEscalationNode(baseState);

    expect(result.status).toBe("detected");
    expect(result.incident.updatedAt).toBeDefined();
  });
});
