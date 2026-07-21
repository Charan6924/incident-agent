import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processEvent } from "../../../inngest/processEvent";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processEvent],
});
