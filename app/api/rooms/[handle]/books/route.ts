import { fail } from "@/lib/api";
import { hasDatabase } from "@/lib/db";
import { canView, roomBooks, roomByHandle } from "@/lib/rooms";
import { currentViewer } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A room's shelves, for refreshing after an import. Private rooms answer only to their owner. */
export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  if (!hasDatabase()) return fail(503, "Rooms aren't open yet on this site.");
  const { handle } = await context.params;
  const room = await roomByHandle(handle.toLowerCase());
  const viewer = await currentViewer();
  if (!room || !canView(room, viewer?.id ?? null)) return fail(404, "There's no room here.");
  return Response.json({ books: await roomBooks(room.id) });
}
