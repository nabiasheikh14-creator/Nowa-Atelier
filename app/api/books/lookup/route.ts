import { isOwner } from "@/lib/auth";
import { lookupIsbn, normalizeIsbn } from "@/lib/open-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isOwner())) return Response.json({ error: "The desk is locked." }, { status: 401 });
  const isbn = normalizeIsbn(new URL(request.url).searchParams.get("isbn") || "");
  if (isbn.length !== 10 && isbn.length !== 13) {
    return Response.json({ error: "Enter a 10 or 13 digit ISBN." }, { status: 400 });
  }
  try {
    const result = await lookupIsbn(isbn);
    if (!result) return Response.json({ error: "Open Library has no record for that ISBN." }, { status: 404 });
    return Response.json({ book: result });
  } catch {
    return Response.json({ error: "Open Library could not be reached." }, { status: 502 });
  }
}
