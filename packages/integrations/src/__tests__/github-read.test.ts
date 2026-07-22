import { describe, it, expect, beforeEach, vi } from "vitest";
import { createGitHubClient } from "../github";

const mockInstance = {
  repos: { listCommits: vi.fn() },
  rest: { repos: { getCommit: vi.fn() } },
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

describe("GitHub client getRecentCommits", () => {
  it("returns commits for a service", async () => {
    mockInstance.repos.listCommits.mockResolvedValue({
      data: [{ sha: "abc123", commit: { message: "fix: cpu spike" } }],
    });

    const client = createGitHubClient();
    const result = await client.getRecentCommits("api-gateway", "2025-01-01");

    expect(mockInstance.repos.listCommits).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      since: "2025-01-01",
      per_page: 50,
      path: "api-gateway",
    });
    expect(result).toHaveLength(1);
    expect(result[0].sha).toBe("abc123");
  });

  it("returns empty array when owner is missing", async () => {
    delete process.env.GITHUB_OWNER;
    const client = createGitHubClient();
    const result = await client.getRecentCommits("api-gateway", "2025-01-01");
    expect(result).toEqual([]);
  });
});

describe("GitHub client getCommitDiff", () => {
  it("returns file diffs for a commit", async () => {
    mockInstance.rest.repos.getCommit.mockResolvedValue({
      data: {
        files: [
          { filename: "src/index.ts", status: "modified" },
        ],
      },
    });

    const client = createGitHubClient();
    const result = await client.getCommitDiff("abc123");

    expect(mockInstance.rest.repos.getCommit).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "abc123",
    });
    expect(result).toHaveLength(1);
    expect(result![0].filename).toBe("src/index.ts");
  });

  it("returns null when owner is missing", async () => {
    delete process.env.GITHUB_OWNER;
    const client = createGitHubClient();
    const result = await client.getCommitDiff("abc123");
    expect(result).toBeNull();
  });
});
