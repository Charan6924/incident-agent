import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPrometheusClient } from "../prometheus";

beforeEach(() => {
  process.env.PROMETHEUS_URL = "https://prometheus.example.com";
  vi.restoreAllMocks();
});

describe("Prometheus client query", () => {
  it("returns metric results", async () => {
    const fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: { result: [{ metric: { __name__: "cpu_usage" }, value: [100, "0.95"] }] } }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createPrometheusClient();
    const result = await client.query('avg(rate(cpu_usage[5m]))');

    expect(fetch).toHaveBeenCalledWith(
      "https://prometheus.example.com/api/v1/query?query=avg(rate(cpu_usage%5B5m%5D))",
    );
    expect(result).toHaveLength(1);
    expect(result[0].metric.__name__).toBe("cpu_usage");
  });

  it("handles empty results", async () => {
    const fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: { result: [] } }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createPrometheusClient();
    const result = await client.query("up");
    expect(result).toEqual([]);
  });
});

describe("Prometheus client queryRange", () => {
  it("returns range results with query params", async () => {
    const fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: { result: [{ values: [[100, "1"], [200, "2"]] }] } }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createPrometheusClient();
    const result = await client.queryRange("cpu_usage", "100", "200", "10");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/query_range?"),
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("query=cpu_usage"),
    );
    expect(result[0].values).toHaveLength(2);
  });
});
