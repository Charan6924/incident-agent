import { describe, it, expect } from "vitest";
import { IncidentStatus } from "../types";

describe("IncidentStatus", () => {
  it("has six statuses", () => {
    expect(Object.keys(IncidentStatus)).toHaveLength(6);
  });

  it("has the correct lifecycle order", () => {
    const statuses = Object.keys(IncidentStatus);
    expect(statuses).toEqual([
      "detected",
      "triaged",
      "investigating",
      "remediating",
      "resolved",
      "closed",
    ]);
  });

  it("all values match their keys", () => {
    for (const key of Object.keys(IncidentStatus)) {
      expect(IncidentStatus[key as keyof typeof IncidentStatus]).toBe(key);
    }
  });

  it("detected is the initial status", () => {
    expect(IncidentStatus.detected).toBe("detected");
  });

  it("closed is the terminal status", () => {
    expect(IncidentStatus.closed).toBe("closed");
  });
});
