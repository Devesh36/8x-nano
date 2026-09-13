import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { connectCreatorStripe, getCreatorEarnings, requestCreatorWithdrawal } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

function getSession(request: NextRequest) {
  return verifySession(request.cookies.get("naano-session")?.value);
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json({ earnings: await getCreatorEarnings(session) });
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { action } = await request.json() as { action?: string };
    if (action === "connect_stripe") return NextResponse.json({ earnings: await connectCreatorStripe(session) });
    if (action === "withdraw") return NextResponse.json({ earnings: await requestCreatorWithdrawal(session) });
    return NextResponse.json({ error: "Unsupported payout action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : mongoErrorMessage(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
