import { Octokit } from "@octokit/rest";

/**
 * Create a GitHub API client for investigating incidents via git history
 * and creating remediation PRs/reverts.
 *
 * Requires env vars: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.
 */
export function createGitHubClient(){
    const octokit = new Octokit({
        auth : process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER!;
    const repo = process.env.GITHUB_REPO!;

    return{
        getRecentCommits: async (service: string, since:string) => {
            if (!owner || !repo){
                return [];
            }
            
            const {data} = await octokit.repos.listCommits({
                owner, repo, since, per_page:50,
                path: service
            })
            return data;

        },

        getCommitDiff: async (sha:string) => {
            if (!owner || !repo){
                return null;
            }

            const {data} = await octokit.rest.repos.getCommit({ owner, repo, ref: sha})

            return data.files ?? [];
        },

        createBranch: async (branchName: string, fromSha?: string) => {
            if (!owner || !repo) return null;

            const {data: ref} = await octokit.rest.git.createRef({
                owner, repo,
                ref: `refs/heads/${branchName}`,
                sha: fromSha ?? (await octokit.rest.repos.getCommit({ owner, repo, ref: "main" })).data.sha,
            });
            return ref;
        },

        mergePR: async (pullNumber: number, method?: "merge" | "squash" | "rebase") => {
            if (!owner || !repo) return null;

            const {data} = await octokit.rest.pulls.merge({
                owner, repo, pull_number: pullNumber, merge_method: method ?? "merge",
            });
            return data;
        },

        createPR: async (head: string, base: string, title: string, body?: string) => {
            if (!owner || !repo) return null;

            const {data} = await octokit.rest.pulls.create({
                owner, repo, head, base, title, body
            });
            return data;
        },

        createRevertPR: async (commitSha: string, baseBranch: string) => {
            if (!owner || !repo) return null;

            const {data: commit} = await octokit.rest.repos.getCommit({
                owner, repo, ref: commitSha
            });

            const revertBranch = `revert/${commitSha.slice(0, 7)}`;
            await octokit.rest.git.createRef({
                owner, repo,
                ref: `refs/heads/${revertBranch}`,
                sha: commitSha,
            });

            const {data: revertCommit} = await octokit.rest.git.createCommit({
                owner, repo,
                message: `Revert ${commitSha.slice(0, 7)}`,
                tree: commit.commit.tree.sha,
                parents: [commit.parents[0]?.sha ?? commitSha],
            });

            await octokit.rest.git.updateRef({
                owner, repo,
                ref: `heads/${revertBranch}`,
                sha: revertCommit.sha,
            });

            const {data: pr} = await octokit.rest.pulls.create({
                owner, repo,
                head: revertBranch,
                base: baseBranch,
                title: `Revert ${commit.commit.message.split("\n")[0]}`,
                body: `Automated revert of ${commitSha}`,
            });

            return pr;
        },
    }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
