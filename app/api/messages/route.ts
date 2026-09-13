import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getMessageThreads, sendWorkspaceMessage } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

function sessionFor(request: NextRequest) {
  return verifySession(request.cookies.get("naano-session")?.value);
}

export async function GET(request: NextRequest) {
  const session = sessionFor(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json({ threads: await getMessageThreads(session) });
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = sessionFor(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json() as { threadId?: string; body?: string };
    if (!body.threadId || typeof body.body !== "string") return NextResponse.json({ error: "Thread and message are required" }, { status: 400 });
    return NextResponse.json({ threads: await sendWorkspaceMessage(session, body.threadId, body.body) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message.includes("message") ? error.message : mongoErrorMessage(error) }, { status: 503 });
  }
}
