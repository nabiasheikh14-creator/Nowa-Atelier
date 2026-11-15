import { fail, readJson, text } from "@/lib/api";
import { hasDatabase } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { findUserByEmail, roomById } from "@/lib/rooms";
import { hashPassword, passwordMatches, sameOrigin, startSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compared against when the email is unknown, so a wrong email takes as long as a wrong password.
let decoy: Promise<string> | null = null;

export async function POST(request: Request) {
  if (!hasDatabase()) return fail(503, "Rooms aren't open yet on this site.");
  if (!sameOrigin(request)) return fail(403, "That request didn't come from The Library.");
  const body = await readJson<Record<string, unknown>>(request);
  const email = text(body?.email, 200).toLowerCase();
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  if (!rateLimit(clientKey(request, "signin"), 10, 15 * 60 * 1000).ok || !rateLimit(`signin-email:${email}`, 8, 15 * 60 * 1000).ok) {
    return fail(429, "Too many tries. Wait 15 minutes, then try again.");
  }
  const user = await findUserByEmail(email);
  decoy ??= hashPassword("decoy-password");
  const ok = user ? await passwordMatches(password, user.password_hash) : (await passwordMatches(password, await decoy), false);
  if (!user || !ok) return fail(401, "That email and password don't match a room.");
  await startSession(user.id);
  const room = await roomById(user.id);
  return Response.json({ handle: room?.handle ?? null });
}
