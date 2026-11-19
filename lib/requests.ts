import { sql } from "./db";
import type { BorrowRequestView, RequestStatus } from "./types";

/**
 * Borrow requests, as the owner of a room sees them. Every read and write is scoped
 * to the owner, so nobody can see or answer requests for someone else's books.
 */

export async function ownerRequests(ownerId: string): Promise<BorrowRequestView[]> {
  return sql()<BorrowRequestView[]>`
    select r.id, r.owner_id, r.book_id, r.requester_name, r.requester_contact, r.message,
           r.status, r.created_at, b.title as book_title, b.author as book_author
    from borrow_requests r
    join books b on b.id = r.book_id
    where r.owner_id = ${ownerId}
    order by (r.status = 'pending') desc, r.created_at desc
    limit 200`;
}

export async function pendingRequestCount(ownerId: string): Promise<number> {
  const [row] = await sql()<{ count: number }[]>`
    select count(*)::int as count from borrow_requests where owner_id = ${ownerId} and status = 'pending'`;
  return row?.count ?? 0;
}

/**
 * Answers a request. Lending marks the book as out, so nobody else can ask for it;
 * a return puts it back on the shelf. Returns null when the request isn't the owner's.
 */
export async function answerRequest(ownerId: string, id: string, status: RequestStatus): Promise<BorrowRequestView | null> {
  const [before] = await sql()<{ status: RequestStatus }[]>`
    select status from borrow_requests where id = ${id} and owner_id = ${ownerId}`;
  if (!before) return null;
  const [request] = await sql()<{ id: string; book_id: string }[]>`
    update borrow_requests set status = ${status}
    where id = ${id} and owner_id = ${ownerId}
    returning id, book_id`;
  if (!request) return null;
  if (status === "approved") {
    await sql()`update books set status = 'lent' where id = ${request.book_id} and owner_id = ${ownerId}`;
  } else if (before.status === "approved") {
    // Taking back a "lent" (returned, or changed your mind): the copy is home again.
    await sql()`update books set status = 'available' where id = ${request.book_id} and owner_id = ${ownerId}`;
  }
  const [view] = await sql()<BorrowRequestView[]>`
    select r.id, r.owner_id, r.book_id, r.requester_name, r.requester_contact, r.message,
           r.status, r.created_at, b.title as book_title, b.author as book_author
    from borrow_requests r join books b on b.id = r.book_id
    where r.id = ${id}`;
  return view ?? null;
}
