"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/lib/types";
import { GENRE_ORDER } from "@/lib/room-plan";
import { crossTags, filterLabel, matches, profileOf, shelfInfo, tagsFor, type Filter } from "@/lib/genres";
import type { Place } from "@/lib/links";
import { spineArt, spineAuthor, spineTitle } from "@/lib/spine-design";
import { hashString } from "@/lib/random";
import { BookPopup } from "./BookPopup";
import Link from "next/link";
import type { RoomContext } from "@/lib/room-page";
import type { DialogName } from "@/components/rooms/RoomTools";

type Variant = "phone" | "list" | "webgl";

/**
 * The library without the room: one shelf per list, spines you can swipe along.
 * Used on phones, in browsers without WebGL, and as the desktop list view.
 */
export function ShelfBrowser({
  books,
  place,
  go,
  variant,
  onRoom,
  context,
  owner,
  onDialog,
}: {
  books: Book[];
  place: Place;
  go: (patch: Partial<Place>, how?: "push" | "replace") => void;
  variant: Variant;
  onRoom?: () => void;
  context: RoomContext;
  owner?: { onSaved: (book: Book) => void; onRemoved: (id: string) => void };
  onDialog: (name: DialogName) => void;
}) {
  const [query, setQuery] = useState("");
  const [moreChips, setMoreChips] = useState(false);
  const filter = place.filter;

  const genres = useMemo(() => {
    const present = new Set(books.map((book) => book.genre));
    return [
      ...GENRE_ORDER.filter((genre) => present.has(genre)),
      ...[...present].filter((genre) => !GENRE_ORDER.includes(genre as (typeof GENRE_ORDER)[number])),
    ];
  }, [books]);

  const byShelf = useMemo(() => {
    const map = new Map<string, Book[]>();
    for (const genre of genres) {
      map.set(
        genre,
        books.filter((book) => book.genre === genre).sort((a, b) => a.title.localeCompare(b.title)),
      );
    }
    return map;
  }, [books, genres]);

  const shelfBooks = useMemo(
    () => (filter?.kind === "shelf" ? books.filter((book) => matches(book, { kind: "shelf", shelf: filter.shelf, tag: null })) : []),
    [books, filter],
  );
  const chips = useMemo(() => (filter?.kind === "shelf" ? tagsFor(shelfBooks) : crossTags(books)), [books, filter, shelfBooks]);
  const matched = useMemo(
    () => (filter ? books.filter((book) => matches(book, filter)).sort((a, b) => a.title.localeCompare(b.title)) : []),
    [books, filter],
  );
  const results = useMemo(() => search(books, query), [books, query]);
  const openBook = books.find((book) => book.id === place.bookId) ?? null;
  const activeTag = filter?.kind === "tag" ? filter.tag : filter?.kind === "shelf" ? filter.tag : null;
  const limit = 6;
  const visibleChips = moreChips ? chips : chips.slice(0, limit);

  function setFilter(next: Filter) {
    setMoreChips(false);
    go({ filter: next, bookId: null });
    window.scrollTo({ top: 0 });
  }

  function pickTag(tag: string | null) {
    if (filter?.kind === "shelf") setFilter({ ...filter, tag: filter.tag === tag ? null : tag });
    else setFilter(tag && !(filter?.kind === "tag" && filter.tag === tag) ? { kind: "tag", tag } : null);
  }

  const shelf = filter?.kind === "shelf" ? shelfInfo(filter.shelf) : null;

  return (
    <main className={`shelves-view ${variant}`}>
      <header className="sv-head">
        <div className="sv-brand">
          <p className="kicker">{context.isOwner ? "Your room" : "The Library"}</p>
          <h1>{context.room.display_name}&apos;s library</h1>
          {context.room.bio && <p className="sv-bio">{context.room.bio}</p>}
        </div>
        <div className="sv-actions">
          {onRoom && (
            <button type="button" className="sv-room" onClick={onRoom}>
              Back to the room
            </button>
          )}
          {context.isOwner ? (
            <>
              <button type="button" className="sv-room" onClick={() => onDialog("requests")}>
                Requests{context.pendingRequests > 0 ? ` · ${context.pendingRequests}` : ""}
              </button>
              <button type="button" className="sv-room" onClick={() => onDialog("add")}>
                Add a book
              </button>
              <button type="button" className="sv-room" onClick={() => onDialog("import")}>
                Import
              </button>
              <button type="button" className="sv-room" onClick={() => onDialog("settings")}>
                Settings
              </button>
            </>
          ) : (
            <>
              <Link className="sv-room" href="/rooms">
                Other rooms
              </Link>
              {context.roomsOpen && (
                <Link className="sv-room" href={context.viewerHandle ? `/@${context.viewerHandle}` : "/join"}>
                  {context.viewerHandle ? "Your room" : "Make your own room"}
                </Link>
              )}
            </>
          )}
        </div>
        <label className="sv-search">
          <span className="sr-only">Search the shelves</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, author, or subgenre"
          />
        </label>
      </header>

      <div className="sv-filters">
        <nav className="sv-tabs" aria-label="Shelves">
          <button type="button" className={!filter ? "on" : ""} aria-current={!filter} onClick={() => setFilter(null)}>
            All shelves
          </button>
          {genres.map((genre) => {
            const current = filter?.kind === "shelf" && filter.shelf === genre;
            return (
              <button
                key={genre}
                type="button"
                className={current ? "on" : ""}
                aria-current={current}
                onClick={() => setFilter({ kind: "shelf", shelf: genre, tag: null })}
              >
                {shelfInfo(genre).label}
              </button>
            );
          })}
        </nav>
        {chips.length > 0 && !query.trim() && (
          <div className={`sv-chips ${moreChips ? "open" : ""}`} role="group" aria-label="Subgenres">
            {shelf && (
              <button type="button" className={!activeTag ? "on" : ""} aria-pressed={!activeTag} onClick={() => pickTag(null)}>
                All
              </button>
            )}
            {visibleChips.map(({ tag, count }) => (
              <button key={tag} type="button" className={activeTag === tag ? "on" : ""} aria-pressed={activeTag === tag} onClick={() => pickTag(tag)}>
                {tag} <em>{count}</em>
              </button>
            ))}
            {chips.length > limit && (
              <button type="button" className="more" aria-expanded={moreChips} onClick={() => setMoreChips((value) => !value)}>
                {moreChips ? "Fewer" : `${chips.length - limit} more`}
              </button>
            )}
          </div>
        )}
      </div>

      {query.trim() ? (
        <section className="sv-results" aria-live="polite">
          {results.length === 0 ? (
            <p className="sv-empty">
              Nothing on the shelves matches “{query.trim()}”. Try an author, or a subgenre like magical realism.
            </p>
          ) : (
            <ul>
              {results.map((book) => (
                <li key={book.id}>
                  <button type="button" onClick={() => go({ bookId: book.id })}>
                    <i style={{ background: spineArt(book.title).ground }} aria-hidden="true" />
                    <strong>{book.title}</strong>
                    <em>
                      {book.author} · {shelfInfo(book.genre).label}
                    </em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : filter ? (
        <section className="sv-shelf">
          <header>
            <h2>{shelf && !filter.tag ? shelf.label : filterLabel(filter)}</h2>
            <p>
              {matched.length} {matched.length === 1 ? "book" : "books"}
              {shelf && !filter.tag && shelf.name !== shelf.label && <> · {shelf.name}</>}
            </p>
          </header>
          <div className="sv-wrap">
            {matched.map((book) => (
              <Spine key={book.id} book={book} onOpen={() => go({ bookId: book.id })} away={filter.kind === "shelf" && book.genre !== filter.shelf} />
            ))}
          </div>
        </section>
      ) : (
        genres.map((genre) => {
          const list = byShelf.get(genre) ?? [];
          const info = shelfInfo(genre);
          return (
            <section key={genre} className="sv-shelf" aria-labelledby={`shelf-${genre}`}>
              <header>
                <h2 id={`shelf-${genre}`}>
                  <button type="button" onClick={() => setFilter({ kind: "shelf", shelf: genre, tag: null })}>
                    {info.label}
                  </button>
                </h2>
                <p>
                  {list.length} {list.length === 1 ? "book" : "books"}
                </p>
              </header>
              <div className="sv-strip" role="list">
                {list.map((book) => (
                  <Spine key={book.id} book={book} onOpen={() => go({ bookId: book.id })} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {variant !== "list" && (
        <p className="sv-note">
          {variant === "webgl"
            ? "This browser can't draw the reading room, so the shelves are laid out flat."
            : "The full reading room opens on a laptop or desktop."}
        </p>
      )}

      {openBook && (
        <BookPopup
          book={openBook}
          owner={
            owner && {
              onSaved: owner.onSaved,
              onRemoved: (id) => {
                owner.onRemoved(id);
                go({ bookId: null });
              },
            }
          }
          onClose={() => go({ bookId: null })}
          onFilter={(next) => {
            go({ filter: next, bookId: null });
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </main>
  );
}

function Spine({ book, onOpen, away }: { book: Book; onOpen: () => void; away?: boolean }) {
  const art = spineArt(book.title);
  const seed = hashString(book.id);
  const height = 176 + (seed % 38);
  // Long titles get a slightly smaller face and a second column, the way real spines do, instead of an ellipsis.
  const text = spineTitle(book.title, art);
  const long = text.length > 22;
  const width = long ? Math.min(58, 40 + (text.length - 22) * 0.6) : Math.max(30, Math.min(44, 22 + text.length * 1.1));
  const size = text.length > 34 ? 0.68 : text.length > 22 ? 0.74 : text.length > 14 ? 0.84 : 0.92;
  const shelf = shelfInfo(book.genre).label;
  return (
    <button
      type="button"
      role="listitem"
      className={`sv-spine ${art.layout} ${art.face} ${book.status === "lent" ? "lent" : ""} ${away ? "away" : ""}`}
      style={{
        ["--ground" as string]: art.ground,
        ["--ink" as string]: art.ink,
        ["--band" as string]: art.band,
        ["--size" as string]: `${size}rem`,
        height,
        width,
      }}
      onClick={onOpen}
      aria-label={`${book.title} by ${book.author}${away ? `, shelved in ${shelf}` : ""}`}
      title={`${book.title} · ${book.author}`}
    >
      <span className="t">{text}</span>
      <span className="a">{spineAuthor(book.author, art)}</span>
      {art.foot && <span className="f">{art.foot}</span>}
    </button>
  );
}

function search(books: Book[], query: string): Book[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return books
    .map((book) => {
      const profile = profileOf(book);
      const haystack = [book.title, book.author, ...profile.shelves.map((id) => shelfInfo(id).label), ...profile.tags, ...profile.subgenres]
        .join(" ")
        .toLowerCase();
      const title = book.title.toLowerCase();
      const score = title.startsWith(needle) ? 3 : title.includes(needle) ? 2 : haystack.includes(needle) ? 1 : 0;
      return { book, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, 20)
    .map((item) => item.book);
}
