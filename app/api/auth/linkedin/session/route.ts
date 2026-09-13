import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "@/lib/auth";

export const runtime = "nodejs";

type ImportedProfile = { provider: "linkedin"; id: string; name: string; email?: string; picture?: string; sourceUrl: string; importedAt: number; exp: number };

export async function GET(request: NextRequest) {
  const profile = verifyValue<ImportedProfile>(request.cookies.get("naano-linkedin-import")?.value);
  return NextResponse.json({ profile: profile && profile.exp > Date.now() ? profile : null });
}
