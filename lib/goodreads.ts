import type { ReadingStatus } from "./types";

/** One book from a Goodreads library export, cleaned up. */
export type GoodreadsRow = {
  title: string;
  author: string;
  isbn: string | null;
  rating: number | null;
  review: string | null;
  status: ReadingStatus;
  shelves: string[];
  year: number | null;
  dateRead: string | null;
};

/** RFC 4180 CSV: quoted fields, doubled quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

const STATUS: Record<string, ReadingStatus> = {
  read: "read",
  "currently-reading": "reading",
  "to-read": "to-read",
};

/** Reads a goodreads_library_export.csv. Returns null if it isn't one. */
export function readGoodreadsExport(text: string): GoodreadsRow[] | null {
  const [header, ...rows] = parseCsv(text.replace(/^﻿/, ""));
  if (!header) return null;
  const col = (name: string) => header.findIndex((cell) => cell.trim().toLowerCase() === name.toLowerCase());
  const at = {
    title: col("Title"),
    author: col("Author"),
    isbn: col("ISBN"),
    isbn13: col("ISBN13"),
    rating: col("My Rating"),
    review: col("My Review"),
    shelf: col("Exclusive Shelf"),
    shelves: col("Bookshelves"),
    year: col("Original Publication Year"),
    published: col("Year Published"),
    dateRead: col("Date Read"),
  };
  if (at.title < 0 || at.author < 0) return null;
  const cell = (cells: string[], index: number) => (index >= 0 ? (cells[index] ?? "").trim() : "");
  // Goodreads wraps ISBNs as ="0439023483" so spreadsheets don't eat the leading zero.
  const isbnOf = (raw: string) => raw.replace(/^="?|"$/g, "").replace(/[^0-9Xx]/g, "") || null;

  return rows
    .map((cells): GoodreadsRow | null => {
      const title = cell(cells, at.title);
      if (!title) return null;
      const exclusive = cell(cells, at.shelf).toLowerCase();
      const rating = Number(cell(cells, at.rating));
      const year = Number(cell(cells, at.year)) || Number(cell(cells, at.published)) || null;
      const review = cell(cells, at.review)
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .trim();
      const date = cell(cells, at.dateRead).replace(/\//g, "-");
      return {
        // Goodreads appends the series, "(The Hunger Games, #1)"; the spine only needs the title.
        title: title.replace(/\s*\([^()]*#\s*\d+(\.\d+)?\)\s*$/, "").slice(0, 300) || title.slice(0, 300),
        author: (cell(cells, at.author) || "Unknown").slice(0, 200),
        isbn: isbnOf(cell(cells, at.isbn13)) ?? isbnOf(cell(cells, at.isbn)),
        rating: rating >= 1 && rating <= 5 ? rating : null,
        review: review ? review.slice(0, 4000) : null,
        status: STATUS[exclusive] ?? "owned",
        shelves: cell(cells, at.shelves)
          .split(",")
          .map((shelf) => shelf.trim())
          .filter((shelf) => shelf && !STATUS[shelf])
          .slice(0, 12),
        year: year && year > 0 && year < 3000 ? year : null,
        dateRead: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
      };
    })
    .filter((row): row is GoodreadsRow => row !== null);
}
