"use client";

import { useEffect, useRef, useState } from "react";
import type { Book } from "@/lib/types";
import { profileOf, shelfInfo, type Filter } from "@/lib/genres";
import { spineArt } from "@/lib/spine-design";

type Borrow =
  | { step: "idle" }
  | { step: "form"; error: string | null }
  | { step: "sending" }
  | { step: "sent"; email: string };

export function BookPopup({
  book,
  onClose,
  onFilter,
}: {
  book: Book;
  onClose: () => void;
  onFilter?: (filter: Filter) => void;
}) {
  const [borrow, setBorrow] = useState<Borrow>({ step: "idle" });
  const [shared, setShared] = useState<"idle" | "copied" | "failed">("idle");
  const [cover, setCover] = useState<"loading" | "ready" | "failed">(book.cover_url ? "loading" : "failed");
  const closeRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (borrow.step === "form") nameRef.current?.focus();
  }, [borrow.step]);

  const profile = profileOf(book);
  const others = profile.shelves.filter((id) => id !== book.genre);
  const canBorrow = book.format === "physical" && book.status === "available";
  const cloth = spineArt(book.title).ground;
  const lightCloth = luminance(cloth) > 0.45;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: `${book.title} · The Library`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShared("failed");
    }
    window.setTimeout(() => setShared("idle"), 2400);
  }

  async function send(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (name.length < 2) {
      setBorrow({ step: "form", error: "Add your name so I know who's asking." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setBorrow({ step: "form", error: "That email doesn't look complete. I'll reply there." });
      return;
    }
    setBorrow({ step: "sending" });
    try {
      const response = await fetch("/api/borrow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          name,
          email,
          message: String(data.get("message") ?? ""),
          company: String(data.get("company") ?? ""),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setBorrow({ step: "form", error: body.error ?? "Your request didn't go through. Try again in a moment." });
        return;
      }
      setBorrow({ step: "sent", email });
    } catch {
      setBorrow({ step: "form", error: "Couldn't send your request. Check your connection and try again." });
    }
  }

  return (
    <div
      className="book-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="book-spread" role="dialog" aria-modal="true" aria-labelledby="book-title">
        <div className="book-tools">
          <button type="button" className="book-share" onClick={() => void share()} aria-live="polite">
            {shared === "copied" ? "Link copied" : shared === "failed" ? "Couldn't copy" : "Copy link"}
          </button>
          <button ref={closeRef} className="book-close" type="button" onClick={onClose}>
            Close <kbd>Esc</kbd>
          </button>
        </div>
        <div className="book-page book-page-left">
          {/* The cloth cover shows while the jacket loads, and stays if it never arrives. */}
          {cover !== "ready" && (
            <div
              className={`cloth-fallback ${lightCloth ? "light" : ""}`}
              style={{ ["--cloth" as string]: cloth }}
              aria-hidden="true"
            >
              <i />
              <strong>{book.title}</strong>
              <span>{book.author}</span>
            </div>
          )}
          {book.cover_url && cover !== "failed" && (
            // Covers come from Open Library and are not sized ahead of time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt={`Cover of ${book.title}`}
              className={cover === "ready" ? "" : "pending"}
              onLoad={() => setCover("ready")}
              onError={() => setCover("failed")}
            />
          )}
        </div>
        <div className="book-gutter" />
        <div className="book-page book-page-right">
          <div className="book-head">
            <p className="kicker">{shelfInfo(book.genre).name}</p>
            <h2 id="book-title">{book.title}</h2>
            <p className="author">{book.author}</p>
            {(book.format === "epub" || book.rating !== null) && (
              <p className="meta-row">
                {book.format === "epub" && <span className="badge epub">Ebook</span>}
                {book.rating !== null && <Stars value={book.rating} />}
              </p>
            )}
          </div>

          {borrow.step === "idle" || borrow.step === "sent" ? (
            <>
              {book.synopsis && <p className="synopsis">{book.synopsis}</p>}
              {book.review && (
                <blockquote>
                  <span>A note in the margin</span>
                  {book.review}
                </blockquote>
              )}

              <dl className="facts">
                <div>
                  <dt>Shelved in</dt>
                  <dd>
                    <FilterLink onFilter={onFilter} filter={{ kind: "shelf", shelf: book.genre, tag: null }}>
                      {shelfInfo(book.genre).label}
                    </FilterLink>
                  </dd>
                </div>
                {others.length > 0 && (
                  <div>
                    <dt>Also on</dt>
                    <dd>
                      {others.map((id, position) => (
                        <span key={id}>
                          {position > 0 && ", "}
                          <FilterLink onFilter={onFilter} filter={{ kind: "shelf", shelf: id, tag: null }}>
                            {shelfInfo(id).label}
                          </FilterLink>
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {profile.tags.length > 0 && (
                  <div className="wide">
                    <dt>Subgenres</dt>
                    <dd className="tags">
                      {profile.tags.map((tag) => (
                        <FilterLink key={tag} onFilter={onFilter} filter={{ kind: "tag", tag }} chip>
                          {tag}
                        </FilterLink>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="book-foot">
                {borrow.step === "sent" ? (
                  <p className="aside done" role="status">
                    Request sent. I&apos;ll reply to {borrow.email} about <em>{book.title}</em>.
                  </p>
                ) : canBorrow ? (
                  <button className="ink-button" type="button" onClick={() => setBorrow({ step: "form", error: null })}>
                    Ask to borrow this
                  </button>
                ) : book.format === "physical" ? (
                  <p className="aside">This copy is out on loan right now.</p>
                ) : (
                  <p className="aside">This one is an ebook, so it can&apos;t be lent.</p>
                )}
              </div>
            </>
          ) : (
            <form
              className="borrow"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void send(event.currentTarget);
              }}
            >
              <p className="borrow-lede">
                Leave your name and email and I&apos;ll reply about <em>{book.title}</em>.
              </p>
              <label>
                <span>Your name</span>
                <input ref={nameRef} name="name" autoComplete="name" maxLength={80} required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" maxLength={160} required />
              </label>
              <label>
                <span>
                  Note <small>optional</small>
                </span>
                <textarea name="message" rows={3} maxLength={2000} placeholder="When you'd like it, or how you know me" />
              </label>
              <input className="trap" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              {borrow.step === "form" && borrow.error && (
                <p className="form-error" role="alert">
                  {borrow.error}
                </p>
              )}
              <div className="form-actions">
                <button className="ink-button" type="submit" disabled={borrow.step === "sending"}>
                  {borrow.step === "sending" ? "Sending…" : "Send request"}
                </button>
                <button type="button" className="text-button" onClick={() => setBorrow({ step: "idle" })}>
                  Back to the book
                </button>
              </div>
            </form>
          )}
        </div>
      </article>
    </div>
  );
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(full.slice(at, at + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function FilterLink({
  filter,
  onFilter,
  chip,
  children,
}: {
  filter: Filter;
  onFilter?: (filter: Filter) => void;
  chip?: boolean;
  children: React.ReactNode;
}) {
  if (!onFilter) return <span className={chip ? "tag" : undefined}>{children}</span>;
  return (
    <button type="button" className={chip ? "tag" : "link"} onClick={() => onFilter(filter)}>
      {children}
    </button>
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
