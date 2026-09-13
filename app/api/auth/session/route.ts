import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  return NextResponse.json({ user: session ? { name: session.name, email: session.email, picture: session.picture, provider: session.provider } : null });
}
