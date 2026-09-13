import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getWorkspaceSnapshot, type WorkspaceRole } from "@/lib/workspace";

export const runtime = "nodejs";

function roleFromRequest(request: NextRequest): WorkspaceRole {
  return request.nextUrl.searchParams.get("role") === "brand" ? "brand" : "creator";
}

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json(await getWorkspaceSnapshot(session, roleFromRequest(request)));
  } catch {
    return NextResponse.json({ error: "MongoDB is not configured or the workspace could not be loaded" }, { status: 503 });
  }
}
