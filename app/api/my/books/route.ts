import { fail, readJson, requireViewer, text } from "@/lib/api";
import { classify } from "@/lib/classify";
import { workDescription, type SearchHit } from "@/lib/open-library";
import { addBooks, bookKey, existingKeys } from "@/lib/rooms";
import type { ReadingStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ReadingStatus[] = ["owned", "reading", "read", "to-read"];

/** Adds one book: from a search result (auto-shelved from its subjects) or typed in by hand. */
export async function POST(request: Request) {
  const viewer = await requireViewer(request, { bucket: "add-book", max: 60, windowMs: 60_000 });
  if (viewer instanceof Response) return viewer;
  const body = await readJson<{ hit?: SearchHit; title?: string; author?: string; reading_status?: string }>(request);
  const hit = body?.hit;
  const title = text(hit?.title ?? body?.title, 300);
  const author = text(hit?.author ?? body?.author, 200) || "Unknown";
  if (!title) return fail(400, "Add the book's title.");
  const status = STATUSES.includes(body?.reading_status as ReadingStatus) ? (body!.reading_status as ReadingStatus) : "owned";

  if ((await existingKeys(viewer.id)).has(bookKey(title, author))) {
    return fail(409, `${title} is already on your shelves.`);
  }

  const shelving = classify({
    title,
    subjects: Array.isArray(hit?.subjects) ? hit!.subjects.map((subject) => text(subject, 80)).slice(0, 25) : [],
    firstPublished: typeof hit?.year === "number" ? hit.year : null,
  });
  const synopsis = hit?.workKey && /^\/works\/OL\w+$/.test(hit.workKey) ? await workDescription(hit.workKey).catch(() => null) : null;
  const coverId = typeof hit?.coverId === "number" ? hit.coverId : null;
  const [book] = await addBooks(viewer.id, [
    {
      title,
      author,
      isbn: hit?.isbn ? text(hit.isbn, 20) : null,
      cover_url: coverId ? `/api/cover?id=${coverId}` : null,
      synopsis,
      ...shelving,
      reading_status: status,
      source: hit ? "search" : "manual",
    },
  ]);
  return Response.json({ book });
}
