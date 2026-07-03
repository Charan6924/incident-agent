import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSlackClient } from "../slack";
import type { Incident } from "@incident-agent/shared";
import { Severity, IncidentStatus } from "@incident-agent/shared";

const mockIncident: Incident = {
  id: 42,
  title: "CPU threshold breach",
  severity: Severity.P1,
  service: "api-gateway",
  status: IncidentStatus.detected,
  events: [],
  timeline: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
  vi.restoreAllMocks();
});

describe("slack client", () => {
  it("sendAlert posts incident to webhook", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    const slack = createSlackClient();
    await slack.sendAlert(mockIncident);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.text).toContain("Incident #42");
    expect(body.text).toContain("P1");
    expect(body.text).toContain("api-gateway");
  });

  it("sendEscalation includes @here", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);

    const slack = createSlackClient();
    await slack.sendEscalation(mockIncident);

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.text).toContain("@here");
    expect(body.text).toContain("Intervention Required");
  });
});
