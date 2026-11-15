import { sql } from "./db";
import { FOUNDER, ownerEmail } from "./founder";
import { hashPassword } from "./session";
import type { Book, ReadingStatus, Room } from "./types";

/** Words that can't be handles: they are, or may become, pages of the site. */
const RESERVED = new Set([
  "admin", "api", "app", "about", "account", "books", "book", "help", "home", "join", "library", "login",
  "logout", "me", "new", "privacy", "room", "rooms", "search", "settings", "signin", "signup", "support",
  "terms", "the-library", "www",
]);

export function cleanHandle(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function handleProblem(handle: string): string | null {
  if (handle.length < 2) return "Your handle needs at least 2 letters or numbers.";
  if (handle.length > 30) return "Keep your handle to 30 characters or fewer.";
  if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(handle)) return "Use lowercase letters, numbers, and dashes.";
  if (RESERVED.has(handle)) return "That handle is taken. Try another.";
  return null;
}

type BookRow = Omit<Book, "rating" | "created_at" | "started_at" | "finished_at"> & {
  rating: string | number | null;
  created_at: Date | string;
  started_at: Date | string | null;
  finished_at: Date | string | null;
};

function toBook(row: BookRow): Book {
  const day = (value: Date | string | null) =>
    value === null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  return {
    ...row,
    rating: row.rating === null ? null : Number(row.rating),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    started_at: day(row.started_at),
    finished_at: day(row.finished_at),
    format: row.format === "epub" ? "epub" : "physical",
    status: row.status === "lent" ? "lent" : "available",
  };
}

const BOOK_COLUMNS = [
  "id", "owner_id", "title", "author", "cover_url", "synopsis", "genre", "format", "rating", "review", "isbn",
  "status", "created_at", "shelves", "subgenres", "reading_status", "started_at", "finished_at",
];

// ——— accounts ———

export async function findUserByEmail(email: string) {
  const [row] = await sql()<{ id: string; email: string; password_hash: string }[]>`
    select id, email, password_hash from users where email = ${email.trim().toLowerCase()}`;
  return row ?? null;
}

/**
 * Creates an account and its room. If the email is OWNER_EMAIL and the founding room is
 * still unclaimed, the account takes that room over instead (same id, books stay put).
 */
export async function createAccount(input: {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}): Promise<{ userId: string; handle: string } | { error: string }> {
  const email = input.email.trim().toLowerCase();
  const hash = await hashPassword(input.password);
  const db = sql();
  try {
    return await db.begin(async (tx) => {
      const [taken] = await tx`select 1 from users where email = ${email}`;
      if (taken) return { error: "There's already a room for that email. Sign in instead." };

      const founder = ownerEmail() === email ? (await tx<Room[]>`select * from profiles where id = ${FOUNDER.id} and claimed = false`)[0] : undefined;
      if (founder) {
        await tx`insert into users (id, email, password_hash) values (${founder.id}, ${email}, ${hash})`;
        await tx`update profiles set claimed = true where id = ${founder.id}`;
        return { userId: founder.id, handle: founder.handle };
      }

      const [handleTaken] = await tx`select 1 from profiles where handle = ${input.handle}`;
      if (handleTaken) return { error: "That handle is taken. Try another." };
      const [user] = await tx<{ id: string }[]>`insert into users (email, password_hash) values (${email}, ${hash}) returning id`;
      await tx`
        insert into profiles (id, handle, display_name, visibility, claimed)
        values (${user!.id}, ${input.handle}, ${input.displayName}, 'private', true)`;
      return { userId: user!.id, handle: input.handle };
    });
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) return { error: "That handle or email is already in use." };
    throw error;
  }
}

// ——— rooms ———

export async function roomByHandle(handle: string): Promise<Room | null> {
  const [row] = await sql()<Room[]>`
    select id, handle, display_name, bio, visibility, claimed from profiles where handle = ${handle}`;
  return row ?? null;
}

export async function roomById(id: string): Promise<Room | null> {
  const [row] = await sql()<Room[]>`
    select id, handle, display_name, bio, visibility, claimed from profiles where id = ${id}`;
  return row ?? null;
}

export async function updateRoom(
  id: string,
  patch: { display_name?: string; handle?: string; bio?: string | null; visibility?: Room["visibility"] },
): Promise<Room | { error: string }> {
  if (patch.handle) {
    const [taken] = await sql()`select 1 from profiles where handle = ${patch.handle} and id <> ${id}`;
    if (taken) return { error: "That handle is taken. Try another." };
  }
  const [row] = await sql()<Room[]>`
    update profiles set
      display_name = coalesce(${patch.display_name ?? null}, display_name),
      handle = coalesce(${patch.handle ?? null}, handle),
      bio = ${patch.bio === undefined ? sql()`bio` : patch.bio},
      visibility = coalesce(${patch.visibility ?? null}, visibility)
    where id = ${id}
    returning id, handle, display_name, bio, visibility, claimed`;
  return row ?? { error: "Room not found." };
}

/** Public rooms for the directory, with a count and what each is reading right now. */
export async function publicRooms(): Promise<(Room & { book_count: number; reading: string[] })[]> {
  const rows = await sql()<(Room & { book_count: number; reading: string[] | null })[]>`
    select p.id, p.handle, p.display_name, p.bio, p.visibility, p.claimed,
      (select count(*)::int from books b where b.owner_id = p.id and b.reading_status <> 'to-read') as book_count,
      (select array_agg(b.title order by b.updated_at desc) from books b where b.owner_id = p.id and b.reading_status = 'reading') as reading
    from profiles p
    where p.visibility = 'public'
    order by book_count desc, p.created_at asc
    limit 200`;
  return rows.map((row) => ({ ...row, reading: (row.reading ?? []).slice(0, 3) }));
}

// ——— books ———

export async function roomBooks(ownerId: string, includeWishlist = false): Promise<Book[]> {
  const rows = await sql()<BookRow[]>`
    select ${sql()(BOOK_COLUMNS)} from books
    where owner_id = ${ownerId} ${includeWishlist ? sql()`` : sql()`and reading_status <> 'to-read'`}
    order by created_at asc`;
  return rows.map(toBook);
}

export async function bookById(id: string): Promise<Book | null> {
  const [row] = await sql()<BookRow[]>`select ${sql()(BOOK_COLUMNS)} from books where id = ${id}`;
  return row ? toBook(row) : null;
}

export type NewBook = {
  title: string;
  author: string;
  cover_url?: string | null;
  synopsis?: string | null;
  isbn?: string | null;
  genre: string;
  shelves: string[];
  subgenres: string[];
  reading_status?: ReadingStatus;
  rating?: number | null;
  review?: string | null;
  finished_at?: string | null;
  source?: string;
  enriched?: boolean;
};

export async function addBooks(ownerId: string, books: NewBook[]): Promise<Book[]> {
  if (books.length === 0) return [];
  const rows = books.map((book) => ({
    owner_id: ownerId,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url ?? null,
    synopsis: book.synopsis ?? null,
    isbn: book.isbn ?? null,
    genre: book.genre,
    shelves: book.shelves,
    subgenres: book.subgenres,
    reading_status: book.reading_status ?? "owned",
    rating: book.rating ?? null,
    review: book.review ?? null,
    finished_at: book.finished_at ?? null,
    source: book.source ?? "manual",
    enriched: book.enriched ?? true,
  }));
  const inserted = await sql()<BookRow[]>`
    insert into books ${sql()(rows)}
    returning ${sql()(BOOK_COLUMNS)}`;
  return inserted.map(toBook);
}

export type BookPatch = {
  rating?: number | null;
  review?: string | null;
  reading_status?: ReadingStatus;
  genre?: string;
  title?: string;
  author?: string;
};

export async function updateBook(ownerId: string, id: string, patch: BookPatch): Promise<Book | null> {
  const current = await bookById(id);
  if (!current || current.owner_id !== ownerId) return null;
  const status = patch.reading_status ?? current.reading_status ?? "owned";
  const today = new Date().toISOString().slice(0, 10);
  const started = status === "reading" && current.reading_status !== "reading" ? today : current.started_at ?? null;
  const finished = status === "read" && current.reading_status !== "read" ? today : current.finished_at ?? null;
  // Moving to a new shelf keeps the old one as a secondary list, the way cross-listing works.
  const shelves = patch.genre && patch.genre !== current.genre
    ? [patch.genre, ...(current.shelves ?? [current.genre]).filter((shelf) => shelf !== patch.genre)]
    : current.shelves ?? [current.genre];
  const [row] = await sql()<BookRow[]>`
    update books set
      rating = ${patch.rating === undefined ? current.rating : patch.rating},
      review = ${patch.review === undefined ? current.review : patch.review},
      reading_status = ${status},
      started_at = ${started},
      finished_at = ${finished},
      genre = ${patch.genre ?? current.genre},
      shelves = ${shelves},
      title = ${patch.title ?? current.title},
      author = ${patch.author ?? current.author},
      updated_at = now()
    where id = ${id} and owner_id = ${ownerId}
    returning ${sql()(BOOK_COLUMNS)}`;
  return row ? toBook(row) : null;
}

export async function deleteBook(ownerId: string, id: string): Promise<boolean> {
  const result = await sql()`delete from books where id = ${id} and owner_id = ${ownerId}`;
  return result.count > 0;
}

/** Books imported without covers or shelves, waiting to be looked up. */
export async function unenrichedBooks(ownerId: string, limit: number) {
  return sql()<{ id: string; title: string; author: string; isbn: string | null; subgenres: string[] }[]>`
    select id, title, author, isbn, subgenres from books
    where owner_id = ${ownerId} and enriched = false
    order by created_at asc limit ${limit}`;
}

export async function countUnenriched(ownerId: string): Promise<number> {
  const [row] = await sql()<{ n: number }[]>`select count(*)::int as n from books where owner_id = ${ownerId} and enriched = false`;
  return row?.n ?? 0;
}

export async function enrichBook(
  ownerId: string,
  id: string,
  data: { cover_url: string | null; synopsis: string | null; genre: string; shelves: string[]; subgenres: string[]; isbn: string | null },
): Promise<void> {
  await sql()`
    update books set
      cover_url = coalesce(${data.cover_url}, cover_url),
      synopsis = coalesce(synopsis, ${data.synopsis}),
      isbn = coalesce(isbn, ${data.isbn}),
      genre = ${data.genre},
      shelves = ${data.shelves},
      subgenres = ${data.subgenres},
      enriched = true,
      updated_at = now()
    where id = ${id} and owner_id = ${ownerId}`;
}

/** Titles already in a room, for skipping duplicates on import. */
export async function existingKeys(ownerId: string): Promise<Set<string>> {
  const rows = await sql()<{ title: string; author: string }[]>`select title, author from books where owner_id = ${ownerId}`;
  return new Set(rows.map((row) => bookKey(row.title, row.author)));
}

export function bookKey(title: string, author: string): string {
  return `${title.toLowerCase().replace(/\s*\(.*?\)\s*$/, "").replace(/[^a-z0-9]/g, "")}|${author.toLowerCase().replace(/[^a-z]/g, "")}`;
}

/** Who may see a room: everyone if public or unlisted, otherwise only its owner. */
export function canView(room: Room, viewerId: string | null): boolean {
  return room.visibility !== "private" || room.id === viewerId;
}
