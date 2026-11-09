import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { ownerPassword, sessionSecret } from "./owner";

export const SESSION_COOKIE = "library_owner";
const MAX_AGE = 60 * 60 * 24 * 14;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function passwordMatches(input: string): boolean {
  const expected = ownerPassword();
  if (!expected || !input) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export function signSession(): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ role: "owner", exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readToken(token: string | undefined): boolean {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      role?: string;
      exp?: number;
    };
    return data.role === "owner" && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isOwner(): Promise<boolean> {
  const jar = await cookies();
  return readToken(jar.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}
