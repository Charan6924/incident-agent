/**
 * Create a Vercel API client for deployment management and rollbacks.
 *
 * Requires env vars: VERCEL_TOKEN, VERCEL_TEAM_ID (optional).
 */
export function createVercelClient() {
  const token = process.env.VERCEL_TOKEN!;
  const teamId = process.env.VERCEL_TEAM_ID;

  const baseUrl = "https://api.vercel.com";

  async function api(path: string, options?: RequestInit) {
    const url = new URL(path, baseUrl);
    if (teamId) url.searchParams.set("teamId", teamId);

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      throw new Error(`Vercel API error: ${res.status} ${await res.text()}`);
    }

    return res.json();
  }

  return {
    listDeployments: async (project?: string) => {
      const params = new URLSearchParams({ limit: "10" });
      if (project) params.set("project", project);
      return api(`/v1/deployments?${params}`);
    },

    rollbackDeployment: async (deploymentId: string) => {
      return api(`/v1/deployments/${deploymentId}/rollback`, {
        method: "POST",
      });
    },

    createDeployment: async (project: string, ref: string) => {
      return api("/v1/deployments", {
        method: "POST",
        body: JSON.stringify({
          name: project,
          gitSource: { ref, type: "branch" },
          projectSettings: { gitBranch: ref },
        }),
      });
    },
  };
}

export type VercelClient = ReturnType<typeof createVercelClient>;
