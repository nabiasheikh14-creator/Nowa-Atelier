import { isOwner } from "@/lib/auth";
import { deleteBook, getBook, setBookStatus, updateBook } from "@/lib/store";
import { parseBook } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "The desk is locked." }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  if (body && Object.keys(body).length === 1 && (body.status === "available" || body.status === "lent")) {
    const existing = await getBook(id);
    if (!existing) return Response.json({ error: "That book is not on the shelves." }, { status: 404 });
    await setBookStatus(id, body.status);
    return Response.json({ book: { ...existing, status: body.status } });
  }
  const parsed = parseBook(body);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const book = await updateBook(id, parsed.value);
  if (!book) return Response.json({ error: "That book is not on the shelves." }, { status: 404 });
  return Response.json({ book });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isOwner())) return Response.json({ error: "The desk is locked." }, { status: 401 });
  const { id } = await context.params;
  const removed = await deleteBook(id);
  if (!removed) return Response.json({ error: "That book is not on the shelves." }, { status: 404 });
  return Response.json({ ok: true });
}
