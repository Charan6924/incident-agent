import type { Incident, InvestigationResult, PostMortem } from "@incident-agent/shared";

/**
 * Create a Slack webhook client for incident notifications.
 *
 * Requires env var: SLACK_WEBHOOK_URL.
 */
export function createSlackClient(){
    const webHookUrl = process.env.SLACK_WEBHOOK_URL!;

    return{
        sendAlert: async(incident : Incident) => {
            await fetch(webHookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                text: `*Incident #${incident.id}* - ${incident.severity}\nService: ${incident.service}\n${incident.title}`,
                })
            })
        },
        sendEscalation : async(incident : Incident) => {
            await fetch(webHookUrl, {
                method : "POST",
                headers : {"Content-Type" : "application/json"},
                body: JSON.stringify({
                    text : `@here Intervention Required!, *Incident #${incident.id}* - ${incident.severity}\nService: ${incident.service}\n${incident.title}`
                })
            })
        },
        sendSummary : async(incident : Incident, postMortem : PostMortem) => {
            await fetch(webHookUrl,{
                method : "POST",
                headers : {"Content-Type" : "application/json"},
                body : JSON.stringify({
                    text : `*Incident #${incident.id} RESOLVED*\nSeverity: ${incident.severity}\nService: ${incident.service}\nRoot Cause: ${postMortem.rootCause}\nTime to Resolve: ${incident.resolvedAt ? new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime() + "ms" : "N/A"}`
                })
            })
        },
        sendApprovalRequest : async(incident : Incident,
            investigation : InvestigationResult,
            approveUrl : string
        ) => {
            const evidenceText = investigation.evidence.map(e => `  • ${e}`).join("\n");
            await fetch(webHookUrl,{
                method: "POST",
                headers : {"Content-Type" : "application/json"},
                body: JSON.stringify({
                    text: `@here *Approval Required: Incident #${incident.id}*\nService: ${incident.service} | Severity: ${incident.severity}\n\n*Root Cause:* ${investigation.rootCause}\n*Confidence:* ${(investigation.confidence * 100).toFixed(0)}%\n*Evidence:*\n${evidenceText}\n\nApprove: ${approveUrl}/approve\nReject: ${approveUrl}/reject`,
                })
            })
        }
    }
}

