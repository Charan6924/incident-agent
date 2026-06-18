// llm reads the alert and classifies severity P0-1 for human and P2-4 for agent
import { llm } from "../llm"
import { Severity, IncidentStatus } from "@incident-agent/shared"
import { IncidentState } from "../state"

/** Structured output classifier for severity + title extraction. */
/** Structured output classifier for severity + title extraction. */
const classifier = llm.withStructuredOutput({
    type: "object",
    properties: {
      severity: { type: "string", enum: ["P0", "P1", "P2", "P3", "P4"] },
      title: { type: "string" },
      summary: { type: "string" },
    },
    required: ["severity", "title", "summary"],
  });

export const triageNode = async (state : IncidentState) => {
    const { title, service } = state.incident
    const { message } = state.incident.events[0]

    const response = await classifier.invoke(
        `Classify this incident alert.\nTitle: ${title}\nMessage: ${message}\nService: ${service}`
    )

    return {
        status : "triaged" as IncidentStatus,
        incident : {
            ...state.incident,
            severity : response.severity as Severity,
            title : response.title,
        },
    }
}
