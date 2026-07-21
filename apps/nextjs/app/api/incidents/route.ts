import { NextRequest, NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";

export async function POST(request: NextRequest) {
  const { source, title, message, service } = await request.json();
  const id = Date.now();

  await inngest.send({
    name: "incident/created",
    data: { title, message, service, source },
  });

  return NextResponse.json({ incidentId: id }, { status: 201 });
}
