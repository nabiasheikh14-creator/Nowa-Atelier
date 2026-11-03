import type { BookFormat, BookInput, BookStatus } from "./types";

const FORMATS = new Set<BookFormat>(["physical", "epub"]);
const STATUSES = new Set<BookStatus>(["available", "lent"]);

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function optional(value: unknown, max: number): string | null {
  const cleaned = text(value, max);
  return cleaned || null;
}

export function parseBook(body: unknown): { ok: true; value: BookInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "The entry is incomplete." };
  const input = body as Record<string, unknown>;
  const title = text(input.title, 180);
  const author = text(input.author, 140);
  const genre = text(input.genre, 40);
  const format = input.format;
  if (!title) return { ok: false, error: "A book needs a title." };
  if (!author) return { ok: false, error: "A book needs an author." };
  if (!genre) return { ok: false, error: "Choose a shelf for it." };
  if (typeof format !== "string" || !FORMATS.has(format as BookFormat)) {
    return { ok: false, error: "Format must be physical or epub." };
  }
  let rating: number | null = null;
  if (input.rating !== null && input.rating !== undefined && input.rating !== "") {
    const value = Number(input.rating);
    if (!Number.isFinite(value) || value < 0 || value > 5) return { ok: false, error: "Rating should be between 0 and 5." };
    rating = Math.round(value * 2) / 2;
  }
  let status: BookStatus = "available";
  if (typeof input.status === "string" && STATUSES.has(input.status as BookStatus)) status = input.status as BookStatus;
  return {
    ok: true,
    value: {
      title,
      author,
      genre,
      format: format as BookFormat,
      rating,
      review: optional(input.review, 4000),
      synopsis: optional(input.synopsis, 2000),
      cover_url: optional(input.cover_url, 500),
      isbn: optional(input.isbn, 20)?.replace(/[^0-9Xx]/g, "").toUpperCase() ?? null,
      status,
    },
  };
}

export function parseBorrow(body: unknown):
  | { ok: true; honeypot: boolean; name: string; contact: string; message: string | null }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "The note is incomplete." };
  const input = body as Record<string, unknown>;
  if (typeof input.company === "string" && input.company.trim()) {
    return { ok: true, honeypot: true, name: "", contact: "", message: null };
  }
  const name = text(input.name, 80);
  const contact = text(input.email, 160);
  if (name.length < 2) return { ok: false, error: "Please leave your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return { ok: false, error: "Please leave a real email address." };
  return { ok: true, honeypot: false, name, contact, message: optional(input.message, 2000) };
}
