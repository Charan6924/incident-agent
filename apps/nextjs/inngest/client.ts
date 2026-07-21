import { EventSchemas, Inngest } from "inngest";

export const inngest = new Inngest({
  id: "incident-agent",
  schemas: new EventSchemas().fromRecord<{
    "incident/created": {
      data: {
        title: string;
        message: string;
        service: string;
        source: string;
      };
    };
    "incident/human-approved": {
      data: {
        incidentId: number;
      };
    };
  }>(),
});
