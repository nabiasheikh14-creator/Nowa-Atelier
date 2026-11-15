import { fail, readJson, text } from "@/lib/api";
import { hasDatabase } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { cleanHandle, createAccount, handleProblem } from "@/lib/rooms";
import { sameOrigin, startSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasDatabase()) return fail(503, "Rooms aren't open yet on this site.");
  if (!sameOrigin(request)) return fail(403, "That request didn't come from The Library.");
  if (!rateLimit(clientKey(request, "signup"), 5, 60 * 60 * 1000).ok) {
    return fail(429, "Too many new rooms from here in a short while. Try again later.");
  }
  const body = await readJson<Record<string, unknown>>(request);
  const email = text(body?.email, 200).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  const displayName = text(body?.displayName, 60);
  const handle = cleanHandle(text(body?.handle, 40));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, "That email doesn't look complete.");
  if (password.length < 8) return fail(400, "Use a password of at least 8 characters.");
  if (password.length > 200) return fail(400, "That password is too long.");
  if (!displayName) return fail(400, "Add the name you'd like on your room.");
  const problem = handleProblem(handle);
  if (problem) return fail(400, problem);

  const result = await createAccount({ email, password, handle, displayName });
  if ("error" in result) return fail(409, result.error);
  await startSession(result.userId);
  return Response.json({ handle: result.handle });
}
