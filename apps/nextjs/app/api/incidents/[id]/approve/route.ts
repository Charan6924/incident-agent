import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const incidentId = parseInt(params.id);

  await inngest.send({
    name: "incident/human-approved",
    data: { incidentId, decision: "approve" },
    user: { match: `incident-${incidentId}` },
  });

  return NextResponse.json({ ok: true });
}

