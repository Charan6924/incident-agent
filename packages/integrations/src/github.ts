const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function getRecentCommits(
  service: string,
  since: string,
): Promise<string[]> {
  // Stub — query GitHub API for recent commits to the service repo
  console.log(`[github] fetching commits for ${service} since ${since}`);
  return [];
}
