"use client";

import { useEffect } from "react";
import type { Book } from "@/lib/types";

export function BookPopup({ book, onClose }: { book: Book; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canBorrow = book.format === "physical" && book.status === "available";

  return (
    <div
      className="book-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="book-spread" role="dialog" aria-modal="true" aria-labelledby="book-title">
        <button className="book-close" type="button" onClick={onClose} aria-label="Close">
          Close
        </button>
        <div className="book-page book-page-left">
          {book.cover_url ? (
            // Covers come from Open Library and are not sized ahead of time.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt={`${book.title} cover`} onError={(event) => (event.currentTarget.style.display = "none")} />
          ) : null}
          <div className="cloth-fallback">
            <span>{book.genre}</span>
            <strong>{book.title}</strong>
          </div>
        </div>
        <div className="book-gutter" />
        <div className="book-page book-page-right">
          <p className="kicker">{book.genre}</p>
          <h2 id="book-title">{book.title}</h2>
          <p className="author">{book.author}</p>
          <p className="meta-row">
            <span className={`badge ${book.format}`}>{book.format === "physical" ? "Physical" : "EPUB"}</span>
            {book.rating !== null && <Stars value={book.rating} />}
          </p>
          {book.synopsis && <p className="synopsis">{book.synopsis}</p>}
          {book.review && (
            <blockquote>
              <span>A note in the margin</span>
              {book.review}
            </blockquote>
          )}
          {canBorrow && (
            <button className="ink-button" type="button">
              Request to borrow
            </button>
          )}
          {book.format === "physical" && book.status === "lent" && (
            <p className="aside">This copy is out at the moment.</p>
          )}
          {book.format === "epub" && <p className="aside ask">Ask me about this one.</p>}
        </div>
      </article>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)));
        return (
          <span key={star} style={{ ["--fill" as string]: `${fill * 100}%` }}>
            ★
          </span>
        );
      })}
    </span>
  );
}
