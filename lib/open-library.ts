export type LookupResult = {
  title: string;
  author: string;
  cover_url: string | null;
  synopsis: string | null;
  isbn: string;
};

function asText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return clean(value);
  if (typeof value === "object" && value && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    if (typeof inner === "string") return clean(inner);
  }
  return null;
}

function clean(input: string): string {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length <= 700) return text;
  const slice = text.slice(0, 700);
  const stop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  return (stop > 240 ? slice.slice(0, stop + 1) : slice).trim();
}

async function getJson(url: string): Promise<unknown | null> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "TheLibrary/1.0 (private collection)" },
    next: { revalidate: 0 },
  });
  if (!response.ok) return null;
  return response.json();
}

export function normalizeIsbn(input: string): string {
  return input.replace(/[^0-9Xx]/g, "").toUpperCase();
}

export async function lookupIsbn(raw: string): Promise<LookupResult | null> {
  const isbn = normalizeIsbn(raw);
  if (isbn.length !== 10 && isbn.length !== 13) return null;

  const edition = (await getJson(`https://openlibrary.org/isbn/${isbn}.json`)) as {
    title?: string;
    authors?: { key?: string }[];
    works?: { key?: string }[];
    covers?: number[];
    description?: unknown;
  } | null;

  let title = edition?.title?.trim() || "";
  let author = "";
  let synopsis = asText(edition?.description);
  const coverId = edition?.covers?.[0];

  const authorKey = edition?.authors?.[0]?.key;
  if (authorKey) {
    const authorDoc = (await getJson(`https://openlibrary.org${authorKey}.json`)) as { name?: string } | null;
    author = authorDoc?.name?.trim() || "";
  }

  const workKey = edition?.works?.[0]?.key;
  if (workKey && !synopsis) {
    const work = (await getJson(`https://openlibrary.org${workKey}.json`)) as {
      description?: unknown;
      title?: string;
    } | null;
    synopsis = asText(work?.description);
    if (!title && work?.title) title = work.title.trim();
  }

  if (!title) {
    const data = (await getJson(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    )) as Record<string, { title?: string; authors?: { name?: string }[]; cover?: { large?: string }; excerpts?: { text?: string }[] }> | null;
    const hit = data?.[`ISBN:${isbn}`];
    if (!hit?.title) return null;
    title = hit.title.trim();
    author = hit.authors?.map((item) => item.name).filter(Boolean).join(", ") || author;
    synopsis = synopsis || clean(hit.excerpts?.[0]?.text || "") || null;
    return {
      title,
      author: author || "Unknown",
      cover_url: hit.cover?.large || `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      synopsis,
      isbn,
    };
  }

  if (!author) {
    const data = (await getJson(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    )) as Record<string, { authors?: { name?: string }[] }> | null;
    const names = data?.[`ISBN:${isbn}`]?.authors?.map((item) => item.name).filter(Boolean) ?? [];
    author = names.join(", ");
  }
  if (!author) author = "Unknown";
  const cover_url = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

  return { title, author, cover_url, synopsis, isbn };
}
