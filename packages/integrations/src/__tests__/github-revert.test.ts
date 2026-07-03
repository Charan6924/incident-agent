import { describe, it, expect, beforeEach, vi } from "vitest";
import { createGitHubClient } from "../github";

const mockInstance = {
  rest: {
    repos: {
      getCommit: vi.fn(),
    },
    git: {
      createRef: vi.fn(),
      createCommit: vi.fn(),
      updateRef: vi.fn(),
    },
    pulls: {
      create: vi.fn(),
    },
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

describe("GitHub client createRevertPR", () => {
  it("creates a revert PR for a commit", async () => {
    mockInstance.rest.repos.getCommit.mockResolvedValue({
      data: {
        sha: "abc123",
        commit: {
          message: "fix: increase connection pool",
          tree: { sha: "tree-sha" },
        },
        parents: [{ sha: "parent-sha" }],
      },
    });
    mockInstance.rest.git.createRef.mockResolvedValueOnce({
      data: { ref: "refs/heads/revert/abc123", sha: "abc123" },
    });
    mockInstance.rest.git.createCommit.mockResolvedValue({
      data: { sha: "revert-sha" },
    });
    mockInstance.rest.git.updateRef.mockResolvedValue({
      data: { ref: "heads/revert/abc123", sha: "revert-sha" },
    });
    mockInstance.rest.pulls.create.mockResolvedValue({
      data: { number: 200, title: "Revert fix: increase connection pool" },
    });

    const client = createGitHubClient();
    const result = await client.createRevertPR("abc123", "main");

    expect(mockInstance.rest.git.createRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "refs/heads/revert/abc123",
      sha: "abc123",
    });
    expect(mockInstance.rest.git.createCommit).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      message: "Revert abc123",
      tree: "tree-sha",
      parents: ["parent-sha"],
    });
    expect(mockInstance.rest.pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({
        head: "revert/abc123",
        base: "main",
        title: "Revert fix: increase connection pool",
      }),
    );
    expect(result?.number).toBe(200);
  });

  it("handles commits without parents", async () => {
    mockInstance.rest.repos.getCommit.mockResolvedValue({
      data: {
        sha: "abc123",
        commit: {
          message: "initial commit",
          tree: { sha: "tree-sha" },
        },
        parents: [],
      },
    });
    mockInstance.rest.git.createRef.mockResolvedValue({
      data: { ref: "refs/heads/revert/abc123" },
    });
    mockInstance.rest.git.createCommit.mockResolvedValue({
      data: { sha: "revert-sha" },
    });
    mockInstance.rest.git.updateRef.mockResolvedValue({ data: {} });
    mockInstance.rest.pulls.create.mockResolvedValue({
      data: { number: 201 },
    });

    const client = createGitHubClient();
    const result = await client.createRevertPR("abc123", "main");

    expect(mockInstance.rest.git.createCommit).toHaveBeenCalledWith(
      expect.objectContaining({ parents: ["abc123"] }),
    );
    expect(result?.number).toBe(201);
  });

  it("returns null when owner is missing", async () => {
    delete process.env.GITHUB_OWNER;
    const client = createGitHubClient();
    const result = await client.createRevertPR("abc123", "main");
    expect(result).toBeNull();
  });
});
