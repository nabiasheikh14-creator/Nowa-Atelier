import { fail, readJson, requireViewer, text } from "@/lib/api";
import { cleanHandle, handleProblem, roomById, updateRoom } from "@/lib/rooms";
import { currentViewer } from "@/lib/session";
import type { Room } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await currentViewer().catch(() => null);
  if (!viewer) return Response.json({ viewer: null });
  return Response.json({ viewer: { handle: viewer.handle }, room: await roomById(viewer.id) });
}

/** Room settings: name, handle, a line about it, and who can see it. */
export async function PATCH(request: Request) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return fail(400, "Nothing to change.");
  const patch: Parameters<typeof updateRoom>[1] = {};
  if (body.displayName !== undefined) {
    const name = text(body.displayName, 60);
    if (!name) return fail(400, "Your room needs a name.");
    patch.display_name = name;
  }
  if (body.handle !== undefined) {
    const handle = cleanHandle(text(body.handle, 40));
    const problem = handleProblem(handle);
    if (problem) return fail(400, problem);
    patch.handle = handle;
  }
  if (body.bio !== undefined) patch.bio = text(body.bio, 280) || null;
  if (body.visibility !== undefined) {
    if (!["private", "unlisted", "public"].includes(String(body.visibility))) return fail(400, "Choose who can see your room.");
    patch.visibility = body.visibility as Room["visibility"];
  }
  const room = await updateRoom(viewer.id, patch);
  if ("error" in room) return fail(409, room.error);
  return Response.json({ room });
}
