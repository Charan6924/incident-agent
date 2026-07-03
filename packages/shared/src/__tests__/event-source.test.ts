import { describe, it, expect } from "vitest";
import { EventSource } from "../types";

describe("EventSource", () => {
  it("has four source types", () => {
    expect(Object.keys(EventSource)).toHaveLength(4);
  });

  it("includes prometheus", () => {
    expect(EventSource.prometheus).toBe("prometheus");
  });

  it("includes datadog", () => {
    expect(EventSource.datadog).toBe("datadog");
  });

  it("includes grafana", () => {
    expect(EventSource.grafana).toBe("grafana");
  });

  it("includes custom", () => {
    expect(EventSource.custom).toBe("custom");
  });

  it("all values match their keys", () => {
    for (const key of Object.keys(EventSource)) {
      expect(EventSource[key as keyof typeof EventSource]).toBe(key);
    }
  });
});
