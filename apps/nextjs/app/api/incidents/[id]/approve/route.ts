import { inngest } from "@/inngest/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const incidentId = parseInt(id);

  await inngest.send({
    name: "incident/human-approved",
    data: { incidentId, decision: "approve" },
    user: { match: `incident-${incidentId}` },
  });

  return NextResponse.json({ ok: true });
}

