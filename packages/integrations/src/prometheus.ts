/**
 * Create a Prometheus API client for querying metrics during incident investigation.
 *
 * Requires env var: PROMETHEUS_URL.
 */
export function createPrometheusClient() {
  const baseUrl = process.env.PROMETHEUS_URL!;

  return {
    query: async (query: string) => {
      const res = await fetch(
        `${baseUrl}/api/v1/query?query=${encodeURIComponent(query)}`,
      );
      const data = await res.json();
      return data.data.result;
    },

    queryRange: async (
      query: string,
      start: string,
      end: string,
      step: string,
    ) => {
      const params = new URLSearchParams({ query, start, end, step });
      const res = await fetch(`${baseUrl}/api/v1/query_range?${params}`);
      const data = await res.json();
      return data.data.result;
    },
  };
}

export type PrometheusClient = ReturnType<typeof createPrometheusClient>;
