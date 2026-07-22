import { inngest } from "./client";
import {
  triageNode,
  investigateNode,
  remediateNode,
  postmortemNode,
  type IncidentState,
} from "@incident-agent/agents";
import { createSlackClient } from "@incident-agent/integrations";
import {
  Incident,
  IncidentEvent,
  IncidentStatus,
  Severity,
} from "@incident-agent/shared";

export const processEvent = inngest.createFunction(
  { id: "process-event" },
  { event: "incident/created" },
  async ({ event, step }) => {
    const now = new Date().toISOString();
    const { title, message, service, source } = event.data;

    const incidentEvent: IncidentEvent = {
      id: Date.now(),
      source,
      title,
      message,
      severity: Severity.P2,
      service,
      timestamp: now,
    };

    const incident: Incident = {
      id: Date.now(),
      title,
      severity: Severity.P2,
      service,
      status: IncidentStatus.detected,
      events: [incidentEvent],
      timeline: [],
      createdAt: now,
      updatedAt: now,
    };

    let state: IncidentState = {
      incident,
      status: IncidentStatus.detected,
      investigationResult: undefined,
      remediationResult: undefined,
      postMortem: undefined,
    };

    const triageResult = await step.run("triage", async () => {
      return triageNode(state);
    });
    state = { ...state, ...triageResult };

    const investigateResult = await step.run("investigate", async () => {
      return investigateNode(state);
    });
    state = { ...state, ...investigateResult };

    if ([Severity.P0, Severity.P1].includes(state.incident.severity)) {
      const slack = createSlackClient();
      const baseUrl = process.env.APP_URL || "http://localhost:3000"
      const approveUrl = `${baseUrl}/api/incidents/${state.incident.id}`;
      await slack.sendApprovalRequest(state.incident, state.investigationResult!, approveUrl)

      const approval = await step.waitForEvent("approve-remediation", {
        event: "incident/human-approved",
        match: `incident-${state.incident.id}`,
        timeout: "10m",
      });

      if ((approval?.data as { decision?: string })?.decision === "approve"){
        const remediateResult = await step.run("remediate", async () => {
          return remediateNode(state);
        });
        state = { ...state, ...remediateResult };
      } else {
        state.remediationResult = { status: "skipped", action: "rejected" };
      }

      const postmortemResult = await step.run("postmortem", async () => {
        return postmortemNode(state);
      });
      state = { ...state, ...postmortemResult };
    } else {
      const remediateResult = await step.run("remediate", async () => {
        return remediateNode(state);
      });
      state = { ...state, ...remediateResult };

      const postmortemResult = await step.run("postmortem", async () => {
        return postmortemNode(state);
      });
      state = { ...state, ...postmortemResult };
    }
  },
);
