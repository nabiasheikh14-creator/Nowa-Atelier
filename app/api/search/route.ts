import { fail, requireViewer } from "@/lib/api";
import { searchBooks } from "@/lib/open-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Book search for adding to your room. Signed-in only, so the site isn't an open proxy. */
export async function GET(request: Request) {
  const viewer = await requireViewer(request, { bucket: "search", max: 60, windowMs: 60_000 });
  if (viewer instanceof Response) return viewer;
  const query = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 120);
  if (query.length < 2) return Response.json({ results: [] });
  try {
    return Response.json({ results: await searchBooks(query) });
  } catch {
    return fail(502, "Couldn't reach the book catalogue. Try again in a moment.");
  }
}
