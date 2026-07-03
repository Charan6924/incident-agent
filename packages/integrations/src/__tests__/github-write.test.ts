import { describe, it, expect, beforeEach, vi } from "vitest";
import { createGitHubClient } from "../github";

const mockInstance = {
  repos: { listCommits: vi.fn() },
  rest: {
    repos: { getCommit: vi.fn() },
    git: { createRef: vi.fn() },
    pulls: { create: vi.fn(), merge: vi.fn() },
  },
};

vi.mock("@octokit/rest", () => ({
  Octokit: class {
    constructor() {
      return mockInstance;
    }
  },
}));

beforeEach(() => {
  process.env.GITHUB_TOKEN = "mock-token";
  process.env.GITHUB_OWNER = "test-owner";
  process.env.GITHUB_REPO = "test-repo";
  vi.clearAllMocks();
});

describe("GitHub client createBranch", () => {
  it("creates a branch from a specific sha", async () => {
    mockInstance.rest.git.createRef.mockResolvedValue({
      data: { ref: "refs/heads/fix/cpu-spike", sha: "abc123" },
    });

    const client = createGitHubClient();
    const result = await client.createBranch("fix/cpu-spike", "abc123");

    expect(mockInstance.rest.git.createRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "refs/heads/fix/cpu-spike",
      sha: "abc123",
    });
    expect(result?.ref).toBe("refs/heads/fix/cpu-spike");
  });

  it("creates a branch from main when no sha given", async () => {
    mockInstance.rest.repos.getCommit.mockResolvedValue({
      data: { sha: "main-sha" },
    });
    mockInstance.rest.git.createRef.mockResolvedValue({
      data: { ref: "refs/heads/fix/cpu-spike", sha: "main-sha" },
    });

    const client = createGitHubClient();
    const result = await client.createBranch("fix/cpu-spike");

    expect(mockInstance.rest.repos.getCommit).toHaveBeenCalledWith({
      owner: "test-owner", repo: "test-repo", ref: "main",
    });
    expect(result?.ref).toBe("refs/heads/fix/cpu-spike");
  });

  it("returns null when owner is missing", async () => {
    delete process.env.GITHUB_OWNER;
    const client = createGitHubClient();
    const result = await client.createBranch("fix/cpu-spike");
    expect(result).toBeNull();
  });
});

describe("GitHub client mergePR", () => {
  it("merges a pull request with default method", async () => {
    mockInstance.rest.pulls.merge.mockResolvedValue({
      data: { merged: true, sha: "merged-sha" },
    });

    const client = createGitHubClient();
    const result = await client.mergePR(42);

    expect(mockInstance.rest.pulls.merge).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
      merge_method: "merge",
    });
    expect(result?.merged).toBe(true);
  });

  it("merges with squash method", async () => {
    mockInstance.rest.pulls.merge.mockResolvedValue({
      data: { merged: true },
    });

    const client = createGitHubClient();
    await client.mergePR(42, "squash");

    expect(mockInstance.rest.pulls.merge).toHaveBeenCalledWith(
      expect.objectContaining({ merge_method: "squash" }),
    );
  });

  it("returns null when owner is missing", async () => {
    delete process.env.GITHUB_OWNER;
    const client = createGitHubClient();
    const result = await client.mergePR(42);
    expect(result).toBeNull();
  });
});

describe("GitHub client createPR", () => {
  it("creates a pull request", async () => {
    mockInstance.rest.pulls.create.mockResolvedValue({
      data: { number: 100, html_url: "https://github.com/test-repo/pull/100" },
    });

    const client = createGitHubClient();
    const result = await client.createPR(
      "fix/cpu-spike", "main", "Fix CPU spike", "Reverts bad config",
    );

    expect(mockInstance.rest.pulls.create).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      head: "fix/cpu-spike",
      base: "main",
      title: "Fix CPU spike",
      body: "Reverts bad config",
    });
    expect(result?.number).toBe(100);
  });

  it("creates PR without body", async () => {
    mockInstance.rest.pulls.create.mockResolvedValue({
      data: { number: 101 },
    });

    const client = createGitHubClient();
    const result = await client.createPR("fix/cpu-spike", "main", "Fix CPU spike");

    expect(mockInstance.rest.pulls.create).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      head: "fix/cpu-spike",
      base: "main",
      title: "Fix CPU spike",
      body: undefined,
    });
    expect(result?.number).toBe(101);
  });

  it("returns null when owner is missing", async () => {
    delete process.env.GITHUB_OWNER;
    const client = createGitHubClient();
    const result = await client.createPR("head", "main", "title");
    expect(result).toBeNull();
  });
});
