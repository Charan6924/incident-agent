import { describe, it, expect, beforeEach, vi } from "vitest";
import { createVercelClient } from "../vercel";

beforeEach(() => {
  process.env.VERCEL_TOKEN = "mock-token";
  delete process.env.VERCEL_TEAM_ID;
  vi.restoreAllMocks();
});

describe("Vercel client", () => {
  it("listDeployments without project", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ deployments: [{ uid: "dpl_1" }] }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createVercelClient();
    const result = await client.listDeployments() as { deployments: { uid: string }[] };

    const url = fetch.mock.calls[0][0] as URL;
    expect(url.href).toContain("/v1/deployments");
    expect(url.href).toContain("limit=10");
    expect(result.deployments).toHaveLength(1);
  });

  it("listDeployments with project filter", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ deployments: [] }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createVercelClient();
    await client.listDeployments("api-gateway");

    const url = fetch.mock.calls[0][0] as URL;
    expect(url.href).toContain("project=api-gateway");
  });

  it("rollbackDeployment sends POST", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "ok" }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createVercelClient();
    const result = await client.rollbackDeployment("dpl_abc") as { status: string };

    const url = fetch.mock.calls[0][0] as URL;
    const opts = fetch.mock.calls[0][1] as any;
    expect(url.href).toBe("https://api.vercel.com/v1/deployments/dpl_abc/rollback");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Authorization).toBe("Bearer mock-token");
    expect(result.status).toBe("ok");
  });

  it("createDeployment sends POST with body", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "app.vercel.app" }),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createVercelClient();
    await client.createDeployment("my-project", "main");

    const opts = fetch.mock.calls[0][1] as any;
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.name).toBe("my-project");
    expect(body.gitSource.ref).toBe("main");
  });

  it("appends teamId when set", async () => {
    process.env.VERCEL_TEAM_ID = "team_abc";
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createVercelClient();
    await client.listDeployments();

    const url = fetch.mock.calls[0][0] as URL;
    expect(url.href).toContain("teamId=team_abc");
  });

  it("throws on non-ok response", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("unauthorized"),
    });
    vi.stubGlobal("fetch", fetch);

    const client = createVercelClient();
    await expect(client.listDeployments()).rejects.toThrow("Vercel API error: 401 unauthorized");
  });
});
