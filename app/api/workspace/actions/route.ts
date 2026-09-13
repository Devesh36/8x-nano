import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { addBrandBudget, createBrandCampaign, deleteBrandCampaign, reviewBrandCollaboration, saveBrandOnboarding } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = verifySession(request.cookies.get("naano-session")?.value);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await request.json() as { action?: string; id?: string; amount?: number; name?: string; description?: string; industry?: string; region?: string; compensation?: number; deadline?: string; companyName?: string; companyWebsite?: string; jobTitle?: string; companySize?: string; country?: string; decision?: "accept" | "decline" };
    if (body.action === "create_campaign") {
      const campaign = await createBrandCampaign(session, { name: body.name?.trim() || "Untitled campaign", description: body.description?.trim() || "A new creator campaign brief ready for review.", industry: body.industry?.trim() || "Software", region: body.region?.trim() || "Europe · North America", compensation: typeof body.compensation === "number" && body.compensation > 0 ? body.compensation : 500, deadline: body.deadline?.trim() || "14 days" });
      return NextResponse.json({ campaign });
    }
    if (body.action === "complete_brand_onboarding") {
      if (!body.companyName?.trim() || !body.jobTitle?.trim()) return NextResponse.json({ error: "Company name and your role are required" }, { status: 400 });
      const profile = await saveBrandOnboarding(session, { companyName: body.companyName.trim(), companyWebsite: body.companyWebsite?.trim(), jobTitle: body.jobTitle.trim(), industry: body.industry?.trim() || "Software", companySize: body.companySize?.trim() || "1–10", country: body.country?.trim() || "India" });
      return NextResponse.json({ profile });
    }
    if (body.action === "delete_campaign" && body.id) {
      await deleteBrandCampaign(session, body.id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "add_budget" && typeof body.amount === "number" && body.amount > 0) {
      await addBrandBudget(session, body.amount);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "review_collaboration" && body.id && (body.decision === "accept" || body.decision === "decline")) {
      await reviewBrandCollaboration(session, body.id, body.decision);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unsupported workspace action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: mongoErrorMessage(error) }, { status: 503 });
  }
}
