import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { linkedinRedirectUri } from "@/lib/auth";

export const runtime = "nodejs";

function failure(request: NextRequest, message: string) {
  const url = new URL("/onboarding", request.url);
  url.searchParams.set("step", "profile");
  url.searchParams.set("linkedin_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId || !process.env.LINKEDIN_CLIENT_SECRET) return failure(request, "LinkedIn import is not configured yet.");

  const state = crypto.randomBytes(32).toString("hex");
  const sourceUrl = request.nextUrl.searchParams.get("profileUrl") || "";
  const linkedinUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  linkedinUrl.searchParams.set("response_type", "code");
  linkedinUrl.searchParams.set("client_id", clientId);
  linkedinUrl.searchParams.set("redirect_uri", linkedinRedirectUri(request.nextUrl.origin));
  linkedinUrl.searchParams.set("state", state);
  linkedinUrl.searchParams.set("scope", "openid profile email");

  const response = NextResponse.redirect(linkedinUrl);
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 600, path: "/" };
  response.cookies.set("naano-linkedin-state", state, options);
  response.cookies.set("naano-linkedin-source", sourceUrl, options);
  return response;
}
