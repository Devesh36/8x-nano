import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getCreatorOpportunities } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  const demo = request.nextUrl.searchParams.get("demo") === "1";
  if (!session && !demo) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json({ opportunities: await getCreatorOpportunities() });
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}
