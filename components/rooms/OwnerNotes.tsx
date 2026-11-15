"use client";

import { useState } from "react";
import { SHELVES, shelfInfo } from "@/lib/genres";
import type { Book, ReadingStatus } from "@/lib/types";
import { call } from "./RoomTools";

const STATUS: { value: ReadingStatus; label: string }[] = [
  { value: "owned", label: "On the shelf" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "to-read", label: "Want to read" },
];

/** In the open book, for the room's owner: rate it, say where you are with it, write about it, move it. */
export function OwnerNotes({
  book,
  onSaved,
  onRemoved,
}: {
  book: Book;
  onSaved: (book: Book) => void;
  onRemoved: (id: string) => void;
}) {
  const [review, setReview] = useState(book.review ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  async function save(patch: Record<string, unknown>) {
    setState("saving");
    setError(null);
    try {
      const { book: updated } = await call<{ book: Book }>(`/api/my/books/${book.id}`, "PATCH", patch);
      onSaved(updated);
      setState("saved");
      window.setTimeout(() => setState((current) => (current === "saved" ? "idle" : current)), 1600);
    } catch (problem) {
      setError((problem as Error).message);
      setState("error");
    }
  }

  async function remove() {
    try {
      await call(`/api/my/books/${book.id}`, "DELETE");
      onRemoved(book.id);
    } catch (problem) {
      setError((problem as Error).message);
    }
  }

  const rating = book.rating ?? 0;
  const shown = hover ?? rating;

  return (
    <section className="owner-notes" aria-label="Your notes">
      <div className="owner-row">
        <span className="owner-label">Your rating</span>
        <span className="star-input" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} ${star === 1 ? "star" : "stars"}${rating === star ? ", tap again to clear" : ""}`}
              aria-pressed={rating >= star}
              className={shown >= star ? "on" : ""}
              onMouseEnter={() => setHover(star)}
              onClick={() => void save({ rating: rating === star ? null : star })}
            >
              ★
            </button>
          ))}
        </span>
      </div>
      <div className="owner-row">
        <span className="owner-label">Where you are</span>
        <span className="segmented" role="radiogroup" aria-label="Where you are with this book">
          {STATUS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={(book.reading_status ?? "owned") === option.value}
              className={(book.reading_status ?? "owned") === option.value ? "on" : ""}
              onClick={() => void save({ reading_status: option.value })}
            >
              {option.label}
            </button>
          ))}
        </span>
      </div>
      <label className="owner-review">
        <span className="owner-label">Your note in the margin</span>
        <textarea value={review} onChange={(event) => setReview(event.target.value)} rows={3} maxLength={4000} placeholder="What stayed with you" />
      </label>
      <div className="owner-actions">
        <button type="button" className="ink-button small" disabled={state === "saving" || review === (book.review ?? "")} onClick={() => void save({ review })}>
          {state === "saving" ? "Saving…" : "Save note"}
        </button>
        <label className="move-shelf">
          <span>Shelf</span>
          <select value={book.genre} onChange={(event) => void save({ genre: event.target.value })}>
            {SHELVES.map((shelf) => (
              <option key={shelf.id} value={shelf.id}>
                {shelfInfo(shelf.id).label}
              </option>
            ))}
          </select>
        </label>
        {confirming ? (
          <span className="confirm">
            Remove from your room?
            <button type="button" className="text-button danger" onClick={() => void remove()}>
              Remove
            </button>
            <button type="button" className="text-button" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </span>
        ) : (
          <button type="button" className="text-button" onClick={() => setConfirming(true)}>
            Remove…
          </button>
        )}
      </div>
      <p className="save-state" role="status">
        {state === "saved" ? "Saved." : state === "error" ? error : ""}
      </p>
    </section>
  );
}
