import crypto from "node:crypto";

export type GoogleSession = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  role: "creator" | "brand";
  provider: "google";
  iat: number;
  exp: number;
};

const sessionSecret = () => process.env.AUTH_SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || "local-development-session-secret";

const encode = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function googleRedirectUri(origin: string) {
  return process.env.NAANO_GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
}

export function linkedinRedirectUri(origin: string) {
  return process.env.NAANO_LINKEDIN_REDIRECT_URI || `${origin}/api/auth/linkedin/callback`;
}

export function signSession(session: GoogleSession) {
  return signValue(session);
}

export function verifySession(value?: string): GoogleSession | null {
  const session = verifyValue<GoogleSession>(value);
  return session && session.exp > Date.now() ? session : null;
}

export function signValue<T>(value: T) {
  const payload = encode(JSON.stringify(value));
  const signature = encode(crypto.createHmac("sha256", sessionSecret()).update(payload).digest());
  return `${payload}.${signature}`;
}

export function verifyValue<T>(value?: string): T | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", sessionSecret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
