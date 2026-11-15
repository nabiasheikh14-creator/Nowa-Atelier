import { hasDatabase } from "./db";
import { clientKey, rateLimit } from "./rate-limit";
import { currentViewer, sameOrigin, type Viewer } from "./session";

export function fail(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

/** Reads a JSON body up to a size limit; null if it isn't JSON or is too large. */
export async function readJson<T>(request: Request, maxBytes = 64_000): Promise<T | null> {
  const text = await request.text().catch(() => "");
  if (!text || text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * The guard for anything that changes a room: there must be a database, the request must
 * come from this site, and someone must be signed in. Returns the viewer or a response to send.
 */
export async function requireViewer(request: Request, limit?: { bucket: string; max: number; windowMs: number }): Promise<Viewer | Response> {
  if (!hasDatabase()) return fail(503, "Rooms aren't open yet on this site.");
  if (!sameOrigin(request)) return fail(403, "That request didn't come from The Library.");
  if (limit) {
    const limited = rateLimit(clientKey(request, limit.bucket), limit.max, limit.windowMs);
    if (!limited.ok) return fail(429, "That's a lot of requests at once. Wait a moment and try again.");
  }
  const viewer = await currentViewer();
  if (!viewer) return fail(401, "Sign in to change your room.");
  return viewer;
}

export function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
