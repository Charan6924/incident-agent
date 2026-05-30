import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../../../.env") });

import { createGitHubClient } from "./github";                                                                                      
                                                                                                                                          
async function main() {
    const client = createGitHubClient();
    try{
        const commits = await client.getRecentCommits("packages/integrations", "2026-01-01T00:00:00Z");
        console.log("Recent Commits:", commits);
    }catch (error){
        console.error("Error fetching commits:", error);
    }
    
  }

main();
