import { describe, it, expect } from "vitest";
import type { InvestigationResult, RemediationResult, PostMortem } from "../types";

describe("InvestigationResult", () => {
  const result: InvestigationResult = {
    rootCause: "Connection pool exhausted",
    evidence: ["CPU at 95%", "connections at 100%"],
    confidence: 0.85,
    summary: "Connection pool too small for traffic spike",
  };

  it("stores root cause", () => {
    expect(result.rootCause).toBe("Connection pool exhausted");
  });

  it("holds evidence strings", () => {
    expect(result.evidence).toHaveLength(2);
    expect(result.evidence[0]).toBe("CPU at 95%");
  });

  it("confidence is between 0 and 1", () => {
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.confidence).toBe(0.85);
  });

  it("has a summary", () => {
    expect(result.summary).toContain("traffic spike");
  });

  it("low confidence is possible", () => {
    const low: InvestigationResult = { ...result, confidence: 0.15 };
    expect(low.confidence).toBe(0.15);
  });

  it("high confidence is possible", () => {
    const high: InvestigationResult = { ...result, confidence: 1.0 };
    expect(high.confidence).toBe(1.0);
  });
});

describe("RemediationResult", () => {
  it("can be pending", () => {
    const r: RemediationResult = { action: "scale up", status: "pending" };
    expect(r.status).toBe("pending");
  });

  it("can be applied", () => {
    const r: RemediationResult = { action: "rolled back deploy", status: "applied" };
    expect(r.status).toBe("applied");
  });

  it("can be failed", () => {
    const r: RemediationResult = { action: "restart service", status: "failed", details: "timeout" };
    expect(r.details).toBe("timeout");
  });

  it("can be skipped", () => {
    const r: RemediationResult = { action: "no action needed", status: "skipped" };
    expect(r.status).toBe("skipped");
  });
});

describe("PostMortem", () => {
  const pm: PostMortem = {
    timeline: [],
    rootCause: "connection pool exhaustion",
    blastRadius: ["api-gateway", "user-service"],
    remediationSteps: ["increase pool size", "add auto-scaling"],
    lessons: ["monitor connection pool usage"],
  };

  it("stores root cause", () => {
    expect(pm.rootCause).toBe("connection pool exhaustion");
  });

  it("lists blast radius services", () => {
    expect(pm.blastRadius).toContain("api-gateway");
  });

  it("lists remediation steps", () => {
    expect(pm.remediationSteps).toHaveLength(2);
  });

  it("captures lessons learned", () => {
    expect(pm.lessons).toContain("monitor connection pool usage");
  });

  it("includes a timeline", () => {
    expect(Array.isArray(pm.timeline)).toBe(true);
  });
});
