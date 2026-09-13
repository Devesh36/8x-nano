import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { googleRedirectUri, signSession } from "@/lib/auth";
import { ensureAccount } from "@/lib/workspace";
import { mongoErrorMessage } from "@/lib/db";

export const runtime = "nodejs";

type GoogleUserInfo = { sub: string; email?: string; name?: string; picture?: string };

function failure(request: NextRequest, message: string) {
  const url = new URL("/signin", request.url);
  url.searchParams.set("error", message);
  if (request.cookies.get("naano-oauth-role")?.value === "brand") url.searchParams.set("role", "brand");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("naano-oauth-state")?.value;
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) return failure(request, "Google sign-in was cancelled.");
  if (!code || !state || !expectedState) return failure(request, "The Google sign-in session expired. Please try again.");

  const stateBuffer = Buffer.from(state);
  const expectedBuffer = Buffer.from(expectedState);
  if (stateBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(stateBuffer, expectedBuffer)) {
    return failure(request, "Google sign-in could not be verified. Please try again.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return failure(request, "Google sign-in is not configured yet.");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: googleRedirectUri(request.nextUrl.origin), grant_type: "authorization_code" }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return failure(request, "Google did not approve this sign-in. Please try again.");
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return failure(request, "Google returned an incomplete sign-in response.");

    const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
    if (!userResponse.ok) return failure(request, "Naano could not read the Google profile for this sign-in.");
    const user = await userResponse.json() as GoogleUserInfo;
    if (!user.sub || !user.email) return failure(request, "The Google account did not provide a usable email address.");

    const now = Date.now();
    const role = request.cookies.get("naano-oauth-role")?.value === "brand" ? "brand" : "creator";
    const session = signSession({ sub: user.sub, email: user.email, name: user.name || user.email.split("@")[0], picture: user.picture, role, provider: "google", iat: now, exp: now + 7 * 24 * 60 * 60 * 1000 });
    if (process.env.MONGODB_URI) {
      try {
        await ensureAccount({ sub: user.sub, email: user.email, name: user.name || user.email.split("@")[0], picture: user.picture, role, provider: "google", iat: now, exp: now + 7 * 24 * 60 * 60 * 1000 });
      } catch (error) {
        console.error("[auth] MongoDB workspace persistence failed", { name: error instanceof Error ? error.name : "UnknownError", code: typeof error === "object" && error && "code" in error ? error.code : undefined });
        return failure(request, `Your Google profile was received, but ${mongoErrorMessage(error)}`);
      }
    }
    const mode = request.cookies.get("naano-oauth-mode")?.value;
    const destination = role === "brand" ? "/brand?auth=google&role=brand#overview" : mode === "signup" ? "/onboarding?step=profile&auth=google&role=creator" : "/creator?auth=google#home";
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.set("naano-session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 7 * 24 * 60 * 60, path: "/" });
    response.cookies.delete("naano-oauth-state");
    response.cookies.delete("naano-oauth-mode");
    response.cookies.delete("naano-oauth-role");
    return response;
  } catch {
    return failure(request, "Google sign-in could not be completed. Please try again.");
  }
}
