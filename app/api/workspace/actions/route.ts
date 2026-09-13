import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { addBrandBudget, createBrandCampaign, deleteBrandCampaign } from "@/lib/workspace";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json() as { action?: string; id?: string; amount?: number; name?: string; description?: string };
    if (body.action === "create_campaign") {
      const campaign = await createBrandCampaign(session, { name: body.name?.trim() || "Untitled campaign", description: body.description?.trim() || "A new creator campaign brief ready for review." });
      return NextResponse.json({ campaign });
    }
    if (body.action === "delete_campaign" && body.id) {
      await deleteBrandCampaign(session, body.id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "add_budget" && typeof body.amount === "number" && body.amount > 0) {
      await addBrandBudget(session, body.amount);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unsupported workspace action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "MongoDB is not configured or the action could not be saved" }, { status: 503 });
  }
}
