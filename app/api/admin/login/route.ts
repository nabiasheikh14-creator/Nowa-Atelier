import { cookies } from "next/headers";
import { passwordMatches, SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "login"), 8, 10 * 60 * 1000);
  if (!limited.ok) {
    return Response.json({ error: "Too many attempts. The desk is resting." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!passwordMatches(password)) {
    return Response.json({ error: "That is not the key to this room." }, { status: 401 });
  }
  const token = signSession();
  if (!token) return Response.json({ error: "The desk is not configured." }, { status: 500 });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  return Response.json({ ok: true });
}
