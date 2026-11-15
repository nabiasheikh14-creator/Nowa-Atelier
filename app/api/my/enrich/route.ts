import { requireViewer } from "@/lib/api";
import { classify } from "@/lib/classify";
import { findBook, workDescription } from "@/lib/open-library";
import { countUnenriched, enrichBook, unenrichedBooks } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Looks up a handful of imported books on Open Library: cover, description, and
 * subjects to shelve them properly. The page calls this until nothing remains.
 */
export async function POST(request: Request) {
  const viewer = await requireViewer(request, { bucket: "enrich", max: 120, windowMs: 60_000 });
  if (viewer instanceof Response) return viewer;
  const batch = await unenrichedBooks(viewer.id, 6);
  await Promise.all(
    batch.map(async (book) => {
      try {
        const hit = await findBook({ title: book.title, author: book.author, isbn: book.isbn });
        const shelving = classify({
          title: book.title,
          subjects: hit?.subjects ?? [],
          userShelves: book.subgenres,
          firstPublished: hit?.year ?? null,
        });
        const synopsis = hit?.workKey ? await workDescription(hit.workKey).catch(() => null) : null;
        await enrichBook(viewer.id, book.id, {
          cover_url: hit?.coverId ? `/api/cover?id=${hit.coverId}` : null,
          synopsis,
          isbn: hit?.isbn ?? null,
          ...shelving,
        });
      } catch {
        // Open Library didn't answer for this one: keep the shelving from the import and move on.
        await enrichBook(viewer.id, book.id, {
          cover_url: null,
          synopsis: null,
          isbn: null,
          ...classify({ title: book.title, userShelves: book.subgenres }),
        });
      }
    }),
  );
  return Response.json({ remaining: await countUnenriched(viewer.id) });
}
