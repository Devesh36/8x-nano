import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { linkedinRedirectUri, signValue } from "@/lib/auth";

export const runtime = "nodejs";

type LinkedInUserInfo = { sub: string; name?: string; given_name?: string; family_name?: string; picture?: string; email?: string; email_verified?: boolean };
type ImportedProfile = { provider: "linkedin"; id: string; name: string; email?: string; picture?: string; sourceUrl: string; importedAt: number; exp: number };

function failure(request: NextRequest, message: string) {
  const url = new URL("/onboarding", request.url);
  url.searchParams.set("step", "profile");
  url.searchParams.set("linkedin_error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("naano-linkedin-state")?.value;
  const sourceUrl = request.cookies.get("naano-linkedin-source")?.value || "";
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    if (oauthError === "access_denied") return failure(request, "LinkedIn authorization was cancelled.");
    const description = request.nextUrl.searchParams.get("error_description");
    return failure(request, description ? `LinkedIn authorization failed: ${description}` : `LinkedIn authorization failed (${oauthError}).`);
  }
  if (!code || !state || !expectedState) return failure(request, "The LinkedIn import session expired. Please try again.");

  const stateBuffer = Buffer.from(state);
  const expectedBuffer = Buffer.from(expectedState);
  if (stateBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(stateBuffer, expectedBuffer)) return failure(request, "LinkedIn import could not be verified. Please try again.");

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) return failure(request, "LinkedIn import is not configured yet.");

  try {
    const callbackUri = linkedinRedirectUri(request.nextUrl.origin);
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUri }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return failure(request, "LinkedIn did not approve this import. Please try again.");
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return failure(request, "LinkedIn returned an incomplete import response.");

    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
    if (!profileResponse.ok) return failure(request, "Naano could not read the LinkedIn profile for this import.");
    const profile = await profileResponse.json() as LinkedInUserInfo;
    const name = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ");
    if (!profile.sub || !name) return failure(request, "LinkedIn did not provide a usable profile name.");

    const now = Date.now();
    const importedProfile: ImportedProfile = { provider: "linkedin", id: profile.sub, name, email: profile.email, picture: profile.picture, sourceUrl, importedAt: now, exp: now + 10 * 60 * 1000 };
    const response = NextResponse.redirect(new URL("/onboarding?step=profile&linkedin=imported", request.url));
    response.cookies.set("naano-linkedin-import", signValue(importedProfile), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
    response.cookies.delete("naano-linkedin-state");
    response.cookies.delete("naano-linkedin-source");
    return response;
  } catch {
    return failure(request, "LinkedIn import could not be completed. Please try again.");
  }
}
