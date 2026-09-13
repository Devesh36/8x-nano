import crypto from "node:crypto";

export type GoogleSession = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  provider: "google";
  iat: number;
  exp: number;
};

const sessionSecret = () => process.env.AUTH_SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || "local-development-session-secret";

const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function redirectUri(origin: string) {
  return process.env.NAANO_GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
}

export function signSession(session: GoogleSession) {
  const payload = encode(JSON.stringify(session));
  const signature = encode(crypto.createHmac("sha256", sessionSecret()).update(payload).digest());
  return `${payload}.${signature}`;
}

export function verifySession(value?: string): GoogleSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as GoogleSession;
    return session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}
