import { fail, readJson, requireViewer } from "@/lib/api";
import { answerRequest } from "@/lib/requests";
import type { RequestStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: RequestStatus[] = ["pending", "approved", "declined", "returned"];

/** Lend it, say no, mark it back home, or undo. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(404, "That request isn't for one of your books.");
  const body = await readJson<{ status?: unknown }>(request);
  const status = body?.status as RequestStatus;
  if (!STATUSES.includes(status)) return fail(400, "Choose an answer for this request.");
  const updated = await answerRequest(viewer.id, id, status);
  if (!updated) return fail(404, "That request isn't for one of your books.");
  return Response.json({ request: updated });
}
