import { inngest } from "./client";
import {}

export const processEvent = inngest.createFunction(
    { id : "process-event", triggers : [{ event : "incident/created"}]},
    async ({event,step}) => {
        await step.run("triage", async () => {

        });

        await step.run("investigate", async() => {

        })

        const humanApproved = await step.waitForEvent("approve-remediation", {
            timeout : "10m",
        })

        await step.run("remediate", async () => {

        })
    }
)
