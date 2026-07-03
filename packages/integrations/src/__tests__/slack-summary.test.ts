import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSlackClient } from "../slack";
import type { Incident, PostMortem } from "@incident-agent/shared";
import { Severity, IncidentStatus } from "@incident-agent/shared";

const mockIncident: Incident = {
  id: 42,
  title: "CPU threshold breach",
  severity: Severity.P1,
  service: "api-gateway",
  status: IncidentStatus.resolved,
  events: [],
  timeline: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:30:00.000Z",
  resolvedAt: "2025-01-01T00:30:00.000Z",
};

const mockPostMortem: PostMortem = {
  timeline: [],
  rootCause: "connection pool exhaustion",
  blastRadius: ["api-gateway"],
  remediationSteps: ["increased pool size"],
  lessons: ["add connection pool monitoring"],
};

beforeEach(() => {
  process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
  vi.restoreAllMocks();
});

describe("slack sendSummary", () => {
  it("posts resolution summary with root cause", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    const slack = createSlackClient();
    await slack.sendSummary(mockIncident, mockPostMortem);

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.text).toContain("RESOLVED");
    expect(body.text).toContain("Incident #42");
    expect(body.text).toContain("connection pool exhaustion");
  });

  it("includes time to resolve", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    const slack = createSlackClient();
    await slack.sendSummary(mockIncident, mockPostMortem);

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.text).toContain("ms");
  });

  it("handles missing resolvedAt", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    const unresolved = { ...mockIncident, resolvedAt: undefined };
    const slack = createSlackClient();
    await slack.sendSummary(unresolved, mockPostMortem);

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.text).toContain("N/A");
  });
});
