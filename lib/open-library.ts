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
    headers: { accept: "application/json", "user-agent": "TheLibrary/1.0 (reading rooms)" },
    signal: AbortSignal.timeout(7000),
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

export type SearchHit = {
  workKey: string | null;
  title: string;
  author: string;
  year: number | null;
  coverId: number | null;
  isbn: string | null;
  subjects: string[];
};

type SearchDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  isbn?: string[];
  subject?: string[];
};

const FIELDS = "key,title,author_name,first_publish_year,cover_i,isbn,subject";

function toHit(doc: SearchDoc): SearchHit | null {
  if (!doc.title) return null;
  const isbn = doc.isbn?.find((value) => value.length === 13) ?? doc.isbn?.[0] ?? null;
  return {
    workKey: doc.key ?? null,
    title: doc.title.trim(),
    author: doc.author_name?.slice(0, 2).join(" and ") || "Unknown",
    year: doc.first_publish_year ?? null,
    coverId: doc.cover_i ?? null,
    isbn,
    subjects: (doc.subject ?? []).slice(0, 25),
  };
}

/** Title, author, or ISBN search against Open Library. */
export async function searchBooks(query: string, limit = 8): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const digits = normalizeIsbn(trimmed);
  const q = digits.length === 10 || digits.length === 13 ? `isbn:${digits}` : trimmed;
  const data = (await getJson(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${limit}&fields=${FIELDS}`,
  )) as { docs?: SearchDoc[] } | null;
  return (data?.docs ?? []).map(toHit).filter((hit): hit is SearchHit => hit !== null);
}

/** Best single match for a book we only know by title, author, and maybe ISBN (e.g. a Goodreads row). */
export async function findBook(input: { title: string; author: string; isbn?: string | null }): Promise<SearchHit | null> {
  const isbn = input.isbn ? normalizeIsbn(input.isbn) : "";
  if (isbn.length === 10 || isbn.length === 13) {
    const [hit] = await searchBooks(isbn, 1);
    if (hit) return hit;
  }
  const title = input.title.replace(/\s*\(.*?\)\s*$/, "").trim(); // Goodreads adds "(Series, #2)"
  const data = (await getJson(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(input.author)}&limit=1&fields=${FIELDS}`,
  )) as { docs?: SearchDoc[] } | null;
  const doc = data?.docs?.[0];
  return doc ? toHit(doc) : null;
}

/** A work's description, for the synopsis. */
export async function workDescription(workKey: string | null): Promise<string | null> {
  if (!workKey) return null;
  const work = (await getJson(`https://openlibrary.org${workKey}.json`)) as { description?: unknown } | null;
  return asText(work?.description);
}
