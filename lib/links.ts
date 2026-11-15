import type { Book } from "./types";
import { SHELVES, type Filter } from "./genres";

/**
 * Every place in the library has an address, so a book or a shelf can be sent
 * to someone and the browser's back button steps back through the room.
 *
 *   /?book=the-kite-runner
 *   /?shelf=literary&tag=family-saga
 *   /?tag=magical-realism
 *   /?view=list
 */

export type View = "room" | "list";
export type Place = { filter: Filter; bookId: string | null; view: View };

export const NOWHERE: Place = { filter: null, bookId: null, view: "room" };

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Shelves are addressed by their visible label: /?shelf=psychology, not the internal id. */
const SHELF_BY_SLUG = new Map(SHELVES.map((shelf) => [slugify(shelf.label), shelf.id]));
const SLUG_BY_SHELF = new Map(SHELVES.map((shelf) => [shelf.id, slugify(shelf.label)]));

export function shelfSlug(id: string): string {
  return SLUG_BY_SHELF.get(id) ?? slugify(id);
}

/** A second copy shares its title's address; the link opens the first copy. */
export function bookSlug(book: Pick<Book, "title">): string {
  return slugify(book.title);
}

export function findBookBySlug(books: Book[], slug: string): Book | null {
  return books.find((book) => bookSlug(book) === slug) ?? null;
}

export function parsePlace(search: string, books: Book[], tags: string[]): Place {
  const params = new URLSearchParams(search);
  const shelf = SHELF_BY_SLUG.get(params.get("shelf") ?? "") ?? null;
  const tagSlug = params.get("tag");
  const tag = tagSlug ? (tags.find((name) => slugify(name) === tagSlug) ?? null) : null;
  const book = params.get("book") ? findBookBySlug(books, params.get("book")!) : null;
  const filter: Filter = shelf ? { kind: "shelf", shelf, tag } : tag ? { kind: "tag", tag } : null;
  return { filter, bookId: book?.id ?? null, view: params.get("view") === "list" ? "list" : "room" };
}

export function placeToSearch(place: Place, books: Book[]): string {
  const params = new URLSearchParams();
  if (place.filter?.kind === "shelf") {
    params.set("shelf", shelfSlug(place.filter.shelf));
    if (place.filter.tag) params.set("tag", slugify(place.filter.tag));
  } else if (place.filter?.kind === "tag") {
    params.set("tag", slugify(place.filter.tag));
  }
  if (place.bookId) {
    const book = books.find((item) => item.id === place.bookId);
    if (book) params.set("book", bookSlug(book));
  }
  if (place.view === "list") params.set("view", "list");
  const query = params.toString();
  return query ? `?${query}` : "";
}
