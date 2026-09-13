import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getCreatorCollaborations } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  if (!session) return NextResponse.json({ collaborations: [] });
  try {
    return NextResponse.json({ collaborations: await getCreatorCollaborations(session) });
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}
