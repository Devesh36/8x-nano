import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { redirectUri } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    const url = new URL("/signin", request.url);
    url.searchParams.set("error", "Google sign-in is not configured yet.");
    return NextResponse.redirect(url);
  }

  const state = crypto.randomBytes(32).toString("hex");
  const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "signin";
  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.searchParams.set("client_id", clientId);
  googleUrl.searchParams.set("redirect_uri", redirectUri(request.nextUrl.origin));
  googleUrl.searchParams.set("response_type", "code");
  googleUrl.searchParams.set("scope", "openid email profile");
  googleUrl.searchParams.set("access_type", "online");
  googleUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(googleUrl);
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 600, path: "/" };
  response.cookies.set("naano-oauth-state", state, cookieOptions);
  response.cookies.set("naano-oauth-mode", mode, cookieOptions);
  return response;
}
