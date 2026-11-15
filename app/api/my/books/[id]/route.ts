import { fail, readJson, requireViewer, text } from "@/lib/api";
import { SHELVES } from "@/lib/genres";
import { deleteBook, updateBook, type BookPatch } from "@/lib/rooms";
import type { ReadingStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ReadingStatus[] = ["owned", "reading", "read", "to-read"];
const SHELF_IDS = new Set(SHELVES.map((shelf) => shelf.id));

/** Your rating, your review, where you are with it, and which shelf it stands on. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(404, "That book isn't in your room.");
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return fail(400, "Nothing to change.");
  const patch: BookPatch = {};
  if (body.rating !== undefined) {
    if (body.rating === null) patch.rating = null;
    else {
      const rating = Math.round(Number(body.rating) * 2) / 2;
      if (!Number.isFinite(rating) || rating < 0.5 || rating > 5) return fail(400, "Ratings go from half a star to five.");
      patch.rating = rating;
    }
  }
  if (body.review !== undefined) patch.review = text(body.review, 4000) || null;
  if (body.reading_status !== undefined) {
    if (!STATUSES.includes(body.reading_status as ReadingStatus)) return fail(400, "Choose where you are with this book.");
    patch.reading_status = body.reading_status as ReadingStatus;
  }
  if (body.genre !== undefined) {
    if (!SHELF_IDS.has(String(body.genre))) return fail(400, "Choose one of the shelves.");
    patch.genre = String(body.genre);
  }
  const book = await updateBook(viewer.id, id, patch);
  if (!book) return fail(404, "That book isn't in your room.");
  return Response.json({ book });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await requireViewer(request);
  if (viewer instanceof Response) return viewer;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return fail(404, "That book isn't in your room.");
  const removed = await deleteBook(viewer.id, id);
  if (!removed) return fail(404, "That book isn't in your room.");
  return Response.json({ ok: true });
}
