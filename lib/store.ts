import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { OWNER_ID } from "./owner";
import { SEED_BOOKS, SEED_REVISION } from "./seed-data";
import type { Book, BookInput, BorrowRequest, BorrowRequestView } from "./types";

type DatabaseShape = {
  revision: number;
  books: Book[];
  borrow_requests: BorrowRequest[];
};

const FILE = path.join(process.cwd(), ".data", "library.json");

let queue: Promise<unknown> = Promise.resolve();
let memoryStore: DatabaseShape | null = null;

function seedShape(): DatabaseShape {
  return {
    revision: SEED_REVISION,
    books: SEED_BOOKS.map((book) => ({ ...book, owner_id: OWNER_ID })),
    borrow_requests: [],
  };
}

function memory(): DatabaseShape {
  memoryStore ??= seedShape();
  return memoryStore;
}

function readOnlyHost(): boolean {
  return process.env.VERCEL === "1";
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function supabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function isBook(value: unknown): value is Book {
  if (!value || typeof value !== "object") return false;
  const book = value as Partial<Book>;
  return typeof book.id === "string" && typeof book.title === "string" && typeof book.genre === "string";
}

async function readFileStore(): Promise<DatabaseShape> {
  if (readOnlyHost()) return memory();
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as DatabaseShape;
    if (!Array.isArray(parsed.books) || !parsed.books.every(isBook) || parsed.revision !== SEED_REVISION) {
      throw new Error("bad store");
    }
    return {
      revision: SEED_REVISION,
      books: parsed.books,
      borrow_requests: Array.isArray(parsed.borrow_requests) ? parsed.borrow_requests : [],
    };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    const reseed = code === "ENOENT" || error instanceof SyntaxError || (error instanceof Error && error.message === "bad store");
    if (!reseed) throw error;
    const fresh = seedShape();
    try {
      await mkdir(path.dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(fresh, null, 2));
    } catch {
      memoryStore = fresh;
    }
    return memoryStore ?? fresh;
  }
}

async function writeFileStore(data: DatabaseShape): Promise<void> {
  if (readOnlyHost()) {
    memoryStore = data;
    return;
  }
  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(data, null, 2));
  } catch {
    memoryStore = data;
  }
}

function usingSupabase(): boolean {
  return supabase() !== null;
}

export function persistenceMode(): "supabase" | "file" {
  return usingSupabase() ? "supabase" : "file";
}

function mapBook(row: Book): Book {
  return {
    ...row,
    cover_url: row.cover_url || null,
    synopsis: row.synopsis || null,
    review: row.review || null,
    isbn: row.isbn || null,
    rating: row.rating === null || row.rating === undefined ? null : Number(row.rating),
  };
}

export async function listBooks(): Promise<Book[]> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("books")
      .select("*")
      .eq("owner_id", OWNER_ID)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as Book[]).map(mapBook);
  }
  const data = await readFileStore();
  return data.books
    .filter((book) => book.owner_id === OWNER_ID)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getBook(id: string): Promise<Book | null> {
  const books = await listBooks();
  return books.find((book) => book.id === id) ?? null;
}

export async function createBook(input: BookInput): Promise<Book> {
  const book: Book = {
    id: crypto.randomUUID(),
    owner_id: OWNER_ID,
    title: input.title,
    author: input.author,
    cover_url: input.cover_url ?? null,
    synopsis: input.synopsis ?? null,
    genre: input.genre,
    format: input.format,
    rating: input.rating ?? null,
    review: input.review ?? null,
    isbn: input.isbn ?? null,
    status: input.status ?? "available",
    created_at: new Date().toISOString(),
  };
  const client = supabase();
  if (client) {
    const { data, error } = await client.from("books").insert(book).select("*").single();
    if (error) throw new Error(error.message);
    return mapBook(data as Book);
  }
  return enqueue(async () => {
    const data = await readFileStore();
    data.books.push(book);
    await writeFileStore(data);
    return book;
  });
}

export async function updateBook(id: string, input: BookInput): Promise<Book | null> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("books")
      .update({
        title: input.title,
        author: input.author,
        cover_url: input.cover_url ?? null,
        synopsis: input.synopsis ?? null,
        genre: input.genre,
        format: input.format,
        rating: input.rating ?? null,
        review: input.review ?? null,
        isbn: input.isbn ?? null,
        status: input.status ?? "available",
      })
      .eq("id", id)
      .eq("owner_id", OWNER_ID)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapBook(data as Book) : null;
  }
  return enqueue(async () => {
    const data = await readFileStore();
    const book = data.books.find((item) => item.id === id && item.owner_id === OWNER_ID);
    if (!book) return null;
    Object.assign(book, {
      title: input.title,
      author: input.author,
      cover_url: input.cover_url ?? null,
      synopsis: input.synopsis ?? null,
      genre: input.genre,
      format: input.format,
      rating: input.rating ?? null,
      review: input.review ?? null,
      isbn: input.isbn ?? null,
      status: input.status ?? book.status,
    });
    await writeFileStore(data);
    return book;
  });
}

export async function deleteBook(id: string): Promise<boolean> {
  const client = supabase();
  if (client) {
    const { error: requestError } = await client
      .from("borrow_requests")
      .delete()
      .eq("book_id", id)
      .eq("owner_id", OWNER_ID);
    if (requestError) throw new Error(requestError.message);
    const { error, count } = await client
      .from("books")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("owner_id", OWNER_ID);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }
  return enqueue(async () => {
    const data = await readFileStore();
    const before = data.books.length;
    data.books = data.books.filter((book) => !(book.id === id && book.owner_id === OWNER_ID));
    data.borrow_requests = data.borrow_requests.filter((request) => request.book_id !== id);
    await writeFileStore(data);
    return data.books.length < before;
  });
}

export async function setBookStatus(id: string, status: Book["status"]): Promise<void> {
  const client = supabase();
  if (client) {
    const { error } = await client.from("books").update({ status }).eq("id", id).eq("owner_id", OWNER_ID);
    if (error) throw new Error(error.message);
    return;
  }
  await enqueue(async () => {
    const data = await readFileStore();
    const book = data.books.find((item) => item.id === id && item.owner_id === OWNER_ID);
    if (book) book.status = status;
    await writeFileStore(data);
  });
}

export async function createBorrowRequest(input: {
  book: Book;
  name: string;
  contact: string;
  message: string | null;
}): Promise<void> {
  const request: BorrowRequest = {
    id: crypto.randomUUID(),
    owner_id: input.book.owner_id,
    book_id: input.book.id,
    requester_name: input.name,
    requester_contact: input.contact,
    message: input.message,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const client = supabase();
  if (client) {
    const { error } = await client.from("borrow_requests").insert(request);
    if (error) throw new Error(error.message);
    return;
  }
  await enqueue(async () => {
    const data = await readFileStore();
    data.borrow_requests.push(request);
    await writeFileStore(data);
  });
}

export async function listBorrowRequests(): Promise<BorrowRequestView[]> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("borrow_requests")
      .select("*")
      .eq("owner_id", OWNER_ID)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const books = await listBooks();
    const byId = new Map(books.map((book) => [book.id, book]));
    return (data as BorrowRequest[]).map((request) => ({
      ...request,
      book_title: byId.get(request.book_id)?.title || "Removed book",
      book_author: byId.get(request.book_id)?.author || "",
    }));
  }
  const data = await readFileStore();
  const byId = new Map(data.books.map((book) => [book.id, book]));
  return data.borrow_requests
    .filter((request) => request.owner_id === OWNER_ID)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((request) => ({
      ...request,
      book_title: byId.get(request.book_id)?.title || "Removed book",
      book_author: byId.get(request.book_id)?.author || "",
    }));
}

export async function decideBorrowRequest(
  id: string,
  status: "approved" | "declined",
): Promise<BorrowRequest | null> {
  const client = supabase();
  if (client) {
    const { data, error } = await client
      .from("borrow_requests")
      .update({ status })
      .eq("id", id)
      .eq("owner_id", OWNER_ID)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const request = data as BorrowRequest;
    if (status === "approved") {
      await setBookStatus(request.book_id, "lent");
      const { error: others } = await client
        .from("borrow_requests")
        .update({ status: "declined" })
        .eq("book_id", request.book_id)
        .eq("owner_id", OWNER_ID)
        .eq("status", "pending");
      if (others) throw new Error(others.message);
    }
    return request;
  }
  return enqueue(async () => {
    const data = await readFileStore();
    const request = data.borrow_requests.find((item) => item.id === id && item.owner_id === OWNER_ID);
    if (!request) return null;
    request.status = status;
    if (status === "approved") {
      const book = data.books.find((item) => item.id === request.book_id);
      if (book) book.status = "lent";
      for (const other of data.borrow_requests) {
        if (other.book_id === request.book_id && other.id !== request.id && other.status === "pending") {
          other.status = "declined";
        }
      }
    }
    await writeFileStore(data);
    return request;
  });
}
