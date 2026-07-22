/** Remediate node: determines and applies a fix based on investigation results. */
import { IncidentState } from "../state";
import { llm } from "../llm"
import { RemediationResult, IncidentStatus } from "@incident-agent/shared";
import { createGitHubClient, createVercelClient } from "@incident-agent/integrations";
import { tool } from "@langchain/core/tools";

// github tool for the llm to create a pr, merge, revert
const githubTool = tool(
    async ({action,head,base,title,body,commitSha,baseBranch} : {
        action : string,
        head? : string,
        base? : string,
        title? : string,
        body? : string,
        commitSha : string,
        baseBranch : string}) => {
        const client = createGitHubClient()

        if (action === "create_pr") {
            const pr = await client.createPR(head!,base!,title!, body);
            return JSON.stringify(pr)
        }
        if (action === "revert"){
            const pr = await client.createRevertPR(commitSha!, baseBranch!);
            return JSON.stringify(pr)
        }
        if (action === "merge_pr"){
            const pr = await client.mergePR(Number(head!));
            return JSON.stringify(pr)
        }

        return "Unknown activity"
    },
    {
        name : "github",
        description : "create a fix PR, revert a commit or merge a PR on github",
        schema : {
            type: "object",
            properties: {
            action: { type: "string", enum: ["create_pr", "revert", "merge_pr"] },
            head: { type: "string" },
            base: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            commitSha: { type: "string" },
            baseBranch: { type: "string" },
            },
            required: ["action"],
        }
    }
);

//tool for the llm
const vercelTool = tool(
    async ({ action, project, ref, deploymentId }: {
      action: string;
      project?: string;
      ref?: string;
      deploymentId?: string;
    }) => {
        const client = createVercelClient();
        if (action === "rollback"){
            return JSON.stringify(await client.rollbackDeployment(deploymentId!));
        }
        if (action === "list_deployments"){
            return JSON.stringify(await client.listDeployments(project));
        }
        if (action === "deploy"){
            return JSON.stringify(await client.createDeployment(project!, ref!));
        }
        return "Unknown action";
    },
    {
        name : "vercel",
        description : " Rollback a deployment, list deployments, or trigger a new deploy on vercel",
        schema : {
            type : "object",
            properties : {
                action : {type : "string", enum : ["rollback", "list_deployments", "deploy"]},
                project : {type : "string"},
                ref : {type : "string"},
                deploymentId: { type: "string" },
            },
            required : ["action"]
        }
    }
)

const classifier = llm.withStructuredOutput({
    type: "object",
    properties: {
        action: { type: "string" },
        status: { type: "string", enum: ["pending", "applied", "failed", "skipped"] },
        details: { type: "string" },
    },
    required: ["action", "status"],
})

export const remediateNode = async (state : IncidentState) => {
    const { title, service, severity } = state.incident
    const { rootCause, summary, confidence, evidence } = state.investigationResult!

    const llmWithTools = llm.bindTools([githubTool, vercelTool]);

    await llmWithTools.invoke([
        `You are remediating a production incident.

        Incident: ${title} (${severity})
        Service: ${service}

        Investigation Results:
        - Root cause: ${rootCause}
        - Summary: ${summary}
        - Confidence: ${confidence}
        - Evidence:
        ${evidence.map((e: string) => `  * ${e}`).join("\n")}

        Available actions:
        - github: create_pr (create a fix PR), revert (revert a bad commit), merge_pr (auto-merge)
        - vercel: rollback (rollback a deploy), list_deployments (list recent deploys), deploy (trigger a new deploy)

        Analyze the root cause and use the appropriate tool to fix the issue.
        If you're confident in the fix, apply it directly (merge or rollback).
        If unsure or a code change is needed, create a PR for human review.`,
            ]);

    const result = await classifier.invoke([
        `Summarize what action was taken to remediate this incident.
        Incident: ${title}
        Root cause: ${rootCause}
        Action taken: describe what was done`,
    ])

    return {
        status : "remediated" as IncidentStatus,
        remediationResult : result as RemediationResult,
    }
}
