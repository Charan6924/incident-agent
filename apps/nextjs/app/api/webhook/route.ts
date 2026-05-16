import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook endpoint — receives alerts from monitoring systems.
 * Validates the payload and enqueues an Inngest function for triage.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate required fields
  if (!body.service || !body.errorType) {
    return NextResponse.json(
      { error: "Missing required fields: service, errorType" },
      { status: 400 },
    );
  }

  // TODO: Enqueue Inngest triage function here
  console.log(`[webhook] alert received: ${body.service} / ${body.errorType}`);

  return NextResponse.json({ status: "accepted" }, { status: 202 });
}
