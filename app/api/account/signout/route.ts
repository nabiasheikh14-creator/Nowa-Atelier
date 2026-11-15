import { fail } from "@/lib/api";
import { endSession, sameOrigin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail(403, "That request didn't come from The Library.");
  await endSession();
  return Response.json({ ok: true });
}
