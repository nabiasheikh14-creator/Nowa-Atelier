"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Book } from "@/lib/types";

export function BookPopup({ book, onClose }: { book: Book; onClose: () => void }) {
  const [note, setNote] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/borrow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        bookId: book.id,
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
        company: form.get("company"),
      }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setError(payload?.error || "The request did not go through.");
      return;
    }
    setSent(true);
  }

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
          {canBorrow && !note && !sent && (
            <button className="ink-button" type="button" onClick={() => setNote(true)}>
              Request to borrow
            </button>
          )}
          {book.format === "physical" && book.status === "lent" && (
            <p className="aside">This copy is out at the moment.</p>
          )}
          {book.format === "epub" && <p className="aside ask">Ask me about this one.</p>}
          {note && !sent && (
            <form className="borrow-form" onSubmit={submit}>
              <label>
                Name
                <input name="name" autoComplete="name" required maxLength={80} />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required maxLength={160} />
              </label>
              <label>
                Message <span>optional</span>
                <textarea name="message" rows={3} maxLength={2000} />
              </label>
              <label className="hp" aria-hidden="true">
                Company
                <input name="company" tabIndex={-1} autoComplete="off" />
              </label>
              {error && <p className="form-error">{error}</p>}
              <div className="form-actions">
                <button className="ink-button" type="submit" disabled={pending}>
                  {pending ? "Sending" : "Send the request"}
                </button>
                <button className="text-button" type="button" onClick={() => setNote(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
          {sent && <p className="aside">Your request is with the keeper of this library.</p>}
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
