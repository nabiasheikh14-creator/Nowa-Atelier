"use client";

import { useState } from "react";
import type { Book } from "@/lib/types";
import { BookPopup } from "./BookPopup";

export function FallbackLibrary({ books, reason }: { books: Book[]; reason: "small" | "webgl" }) {
  const [open, setOpen] = useState<Book | null>(null);
  return (
    <main className="fallback">
      <p className="kicker">The Library</p>
      <h1>This library is best experienced on a desktop.</h1>
      <p className="lede">
        {reason === "webgl"
          ? "This browser cannot open the reading room, so the shelves are listed here instead."
          : "The room is built for a large screen. The collection is below, plainly."}
      </p>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <button type="button" onClick={() => setOpen(book)}>
              <span>{book.title}</span>
              <span>{book.author}</span>
              <span>{book.genre}</span>
            </button>
          </li>
        ))}
      </ul>
      {open && <BookPopup book={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
