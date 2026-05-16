import { NextResponse } from "next/server";

// In-memory store — replace with Neon Postgres later
const incidents: unknown[] = [];

export async function GET() {
  return NextResponse.json(incidents);
}

export async function POST(request: Request) {
  const body = await request.json();
  incidents.push(body);
  return NextResponse.json(body, { status: 201 });
}
