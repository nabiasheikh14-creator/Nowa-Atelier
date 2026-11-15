import { hasDatabase, sql } from "./db";
import { FOUNDER, ownerEmail } from "./founder";
import { bookById, roomBooks } from "./rooms";
import { SEED_BOOKS } from "./seed-data";
import type { Book, BorrowRequest } from "./types";

/**
 * The few reads and writes that must work with or without a database: the founding
 * room's shelves and the borrow form. Without a database the seed collection is served
 * read-only and borrow requests are kept in memory for the life of the server.
 */
const memoryRequests: BorrowRequest[] = [];

export async function foundingBooks(): Promise<Book[]> {
  return hasDatabase() ? roomBooks(FOUNDER.id) : SEED_BOOKS;
}

export async function getBook(id: string): Promise<Book | null> {
  if (hasDatabase()) return bookById(id);
  return SEED_BOOKS.find((book) => book.id === id) ?? null;
}

export async function createBorrowRequest(input: {
  book: Book;
  name: string;
  contact: string;
  message: string | null;
}): Promise<void> {
  if (hasDatabase()) {
    await sql()`
      insert into borrow_requests (owner_id, book_id, requester_name, requester_contact, message)
      values (${input.book.owner_id}, ${input.book.id}, ${input.name}, ${input.contact}, ${input.message})`;
    return;
  }
  memoryRequests.push({
    id: crypto.randomUUID(),
    owner_id: input.book.owner_id,
    book_id: input.book.id,
    requester_name: input.name,
    requester_contact: input.contact,
    message: input.message,
    status: "pending",
    created_at: new Date().toISOString(),
  });
}

/** Where a room's borrow requests are emailed: the owner's account email, never shown to visitors. */
export async function ownerAddress(ownerId: string): Promise<string | null> {
  if (hasDatabase()) {
    const [row] = await sql()<{ email: string }[]>`select email from users where id = ${ownerId}`;
    if (row) return row.email;
  }
  return ownerId === FOUNDER.id ? ownerEmail() : null;
}
