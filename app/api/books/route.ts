import { isOwner } from "@/lib/auth";
import { createBook, listBooks } from "@/lib/store";
import { parseBook } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const books = await listBooks();
  return Response.json({ books });
}

export async function POST(request: Request) {
  if (!(await isOwner())) return Response.json({ error: "The desk is locked." }, { status: 401 });
  const parsed = parseBook(await request.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 });
  const book = await createBook(parsed.value);
  return Response.json({ book }, { status: 201 });
}
