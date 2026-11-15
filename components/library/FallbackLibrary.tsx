"use client";

import { useState } from "react";
import type { Book } from "@/lib/types";
import { BookPopup } from "./BookPopup";
import { shelfInfo } from "@/lib/genres";

export function FallbackLibrary({ books, reason }: { books: Book[]; reason: "small" | "webgl" }) {
  const [open, setOpen] = useState<Book | null>(null);
  return (
    <main className="fallback">
      <p className="kicker">The Library</p>
      <h1>The room opens on a larger screen.</h1>
      <p className="lede">
        {reason === "webgl"
          ? "This browser can't draw the reading room, so every book is listed below instead."
          : "Open this on a laptop or desktop to walk the shelves. Every book is listed below in the meantime."}
      </p>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <button type="button" onClick={() => setOpen(book)}>
              <span>{book.title}</span>
              <span>{book.author}</span>
              <span>{shelfInfo(book.genre).label}</span>
            </button>
          </li>
        ))}
      </ul>
      {open && <BookPopup book={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
