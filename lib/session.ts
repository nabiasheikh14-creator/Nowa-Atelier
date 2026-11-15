import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { hasDatabase, sql } from "./db";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

export const SESSION_COOKIE = "library_session";
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export type Viewer = { id: string; email: string; handle: string | null };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function passwordMatches(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, saltText, keyText] = stored.split("$");
  if (kind !== "scrypt" || !saltText || !keyText) return false;
  const expected = Buffer.from(keyText, "base64");
  const actual = await scrypt(password, Buffer.from(saltText, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Starts a session: a random token in an httpOnly cookie, only its hash in the database. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await sql()`insert into sessions (token_hash, user_id, expires_at) values (${tokenHash(token)}, ${userId}, ${expires})`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && hasDatabase()) await sql()`delete from sessions where token_hash = ${tokenHash(token)}`;
  jar.delete(SESSION_COOKIE);
}

/** Who is looking, if anyone. Safe to call from pages and routes. */
export async function currentViewer(): Promise<Viewer | null> {
  if (!hasDatabase()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await sql()<{ id: string; email: string; handle: string | null }[]>`
    select u.id, u.email, p.handle
    from sessions s
    join users u on u.id = s.user_id
    left join profiles p on p.id = u.id
    where s.token_hash = ${tokenHash(token)} and s.expires_at > now()`;
  return row ?? null;
}

/**
 * Cookies are SameSite=Lax, so other sites can't post with them. As a second guard,
 * state-changing requests must come from this site's own pages.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
