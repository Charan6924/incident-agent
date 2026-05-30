import { Octokit } from "@octokit/rest";                                                                                                  

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
                owner, repo, since, per_page:50
            })
            return data;

        },

        getCommitDiff: async (sha:string) => {
            if (!owner || !repo){
                return null;
            }

            const {data} = await octokit.rest.repos.getCommit({ owner, repo, ref: sha})

            return data.files ?? [];
        }
    }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
