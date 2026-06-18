/** Investigate node: gathers git history and metrics, then uses the LLM to determine root cause. */
import { IncidentState } from "../state";
import { llm } from "../llm"
import { InvestigationResult } from "@incident-agent/shared";
import { createGitHubClient, createPrometheusClient } from "@incident-agent/integrations";
import { tool } from "@langchain/core/tools"
/** Tool for querying Prometheus metrics during investigation. */
const prometheusTool = tool(
  async ({ query }: { query: string }) => {
    const client = createPrometheusClient();
    const result = await client.query(query);
    return JSON.stringify(result);
  },
  {
    name: "query_prometheus",
    description: "Query Prometheus metrics. Use to check CPU, memory, latency, error rates.",
    schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  }
);

/** Tool for fetching recent git commits during investigation. */
const gitTool = tool(
  async ({ service, since }: { service: string; since: string }) => {
    const client = createGitHubClient();
    const commits = await client.getRecentCommits(service, since);
    return JSON.stringify(commits);
  },
  {
    name: "get_recent_commits",
    description: "Get recent git commits for a service.",
    schema: {
      type: "object",
      properties: {
        service: { type: "string" },
        since: { type: "string" },
      },
      required: ["service", "since"],
    },
  }
);

/** Structured output classifier for investigation results. */
const classifier = llm.withStructuredOutput({
    type: "object",
    properties : {
        rootCause : {type :"string"},
        evidence : {
          type: "array",
          items: { type: "string" },
        },
        confidence : {type : "number", description: "0.0 to 1.0"},
        summary : { type : "string"}
    },
    required: ["rootCause", "evidence", "confidence", "summary"],
})

export const investigateNode = async (state : IncidentState) => {
    const { title, service, createdAt } = state.incident
    const { message } = state.incident.events[0]

    const llmWithTools = llm.bindTools([prometheusTool, gitTool])

    const response = await llmWithTools.invoke([
        "You are investigating a production incident. Use the available tools to gather data, then determine the root cause.",
        `Service: ${service}\nAlert: ${title}\nMessage: ${message}\nTime: ${createdAt}`,
    ])

    const result = await classifier.invoke([
      "Based on the gathered data, provide the root cause analysis.",
      `Investigation findings: ${response.content}`,
    ])

    return {
        status : "investigating" as const,
        investigationResult : result as InvestigationResult,
    }
}
