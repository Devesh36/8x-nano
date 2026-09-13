import { NextResponse } from "next/server";

export const runtime = "nodejs";

const sessionCookies = [
  "naano-session",
  "naano-linkedin-import",
  "naano-linkedin-state",
  "naano-linkedin-source",
  "naano-oauth-state",
  "naano-oauth-mode",
];

export async function POST() {
  const response = NextResponse.json({ ok: true });
  sessionCookies.forEach((name) => response.cookies.delete(name));
  return response;
}

export async function GET() {
  return POST();
}
