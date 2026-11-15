import { fail, readJson, requireViewer, text } from "@/lib/api";
import { classify } from "@/lib/classify";
import type { GoodreadsRow } from "@/lib/goodreads";
import { addBooks, bookKey, existingKeys, type NewBook } from "@/lib/rooms";
import type { ReadingStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ReadingStatus[] = ["owned", "reading", "read", "to-read"];

/**
 * Takes up to 200 rows of a Goodreads export (parsed in the browser) and shelves them
 * straight away from the reader's own Goodreads shelves. Covers and better shelving
 * follow from /api/my/enrich.
 */
export async function POST(request: Request) {
  const viewer = await requireViewer(request, { bucket: "import", max: 40, windowMs: 10 * 60_000 });
  if (viewer instanceof Response) return viewer;
  const body = await readJson<{ rows?: GoodreadsRow[] }>(request, 600_000);
  const rows = Array.isArray(body?.rows) ? body!.rows.slice(0, 200) : null;
  if (!rows) return fail(400, "That file didn't come through. Try choosing it again.");

  const seen = await existingKeys(viewer.id);
  const books: NewBook[] = [];
  let skipped = 0;
  for (const row of rows) {
    const title = text(row?.title, 300);
    const author = text(row?.author, 200) || "Unknown";
    if (!title) continue;
    const key = bookKey(title, author);
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    const shelves = Array.isArray(row.shelves) ? row.shelves.map((shelf) => text(shelf, 60)).filter(Boolean).slice(0, 12) : [];
    const status = STATUSES.includes(row.status) ? row.status : "owned";
    const rating = typeof row.rating === "number" && row.rating >= 1 && row.rating <= 5 ? Math.round(row.rating) : null;
    books.push({
      title,
      author,
      isbn: row.isbn ? text(row.isbn, 20).replace(/[^0-9Xx]/g, "") || null : null,
      rating,
      review: row.review ? text(row.review, 4000) : null,
      reading_status: status,
      finished_at: typeof row.dateRead === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.dateRead) ? row.dateRead : null,
      ...classify({ title, userShelves: shelves, firstPublished: typeof row.year === "number" ? row.year : null }),
      source: "goodreads",
      enriched: false,
    });
  }
  await addBooks(viewer.id, books);
  return Response.json({ added: books.length, skipped });
}
