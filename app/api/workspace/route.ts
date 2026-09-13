import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getWorkspaceSnapshot, type WorkspaceRole } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

function roleFromRequest(request: NextRequest): WorkspaceRole {
  return request.nextUrl.searchParams.get("role") === "brand" ? "brand" : "creator";
}

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json(await getWorkspaceSnapshot(session, roleFromRequest(request)));
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}
