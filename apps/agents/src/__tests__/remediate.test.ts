import { describe, it, expect, beforeEach, vi } from "vitest";
import { remediateNode } from "../nodes/remediate";
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
    status: IncidentStatus.investigating,
    events: [],
    timeline: [],
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  status: IncidentStatus.investigating,
  investigationResult: {
    rootCause: "Connection pool exhausted",
    evidence: ["CPU at 95%"],
    confidence: 0.9,
    summary: "Pool too small",
  },
} as unknown as IncidentState;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("remediateNode", () => {
  it("returns status remediated", async () => {
    mockToolInvoke.mockResolvedValue({ content: "Rolled back deploy" });
    mockClassifierInvoke.mockResolvedValue({
      action: "rolled back deployment to previous version",
      status: "applied",
    });

    const result = await remediateNode(baseState);

    expect(result.status).toBe("remediated");
  });

  it("returns remediation result with action and status", async () => {
    mockToolInvoke.mockResolvedValue({ content: "Created fix PR" });
    mockClassifierInvoke.mockResolvedValue({
      action: "created PR to increase pool size",
      status: "pending",
      details: "PR #123 awaiting review",
    });

    const result = await remediateNode(baseState);

    expect(result.remediationResult).toBeDefined();
    expect(result.remediationResult.action).toBe("created PR to increase pool size");
    expect(result.remediationResult.status).toBe("pending");
    expect(result.remediationResult.details).toBe("PR #123 awaiting review");
  });

  it("marks remediation as failed when applicable", async () => {
    mockToolInvoke.mockResolvedValue({ content: "Rollback failed" });
    mockClassifierInvoke.mockResolvedValue({
      action: "attempted rollback",
      status: "failed",
      details: "Deploy stack inconsistent",
    });

    const result = await remediateNode(baseState);

    expect(result.remediationResult.status).toBe("failed");
  });
});
