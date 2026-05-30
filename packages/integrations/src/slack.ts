import type { Incident, PostMortem } from "@incident-agent/shared";

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
    }
}
