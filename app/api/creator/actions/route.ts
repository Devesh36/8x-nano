import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { applyToCreatorOpportunity } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json() as { action?: string; opportunityId?: string };
    if (body.action !== "apply" || !body.opportunityId) return NextResponse.json({ error: "Unsupported creator action" }, { status: 400 });
    return NextResponse.json({ collaboration: await applyToCreatorOpportunity(session, body.opportunityId) });
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}
