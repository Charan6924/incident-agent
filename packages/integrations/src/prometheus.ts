const PROMETHEUS_URL = process.env.PROMETHEUS_URL ?? "http://localhost:9090";

export async function queryMetrics(
  query: string,
): Promise<Record<string, unknown>[]> {
  // Stub — query Prometheus API
  console.log(`[prometheus] querying: ${query}`);
  return [];
}
