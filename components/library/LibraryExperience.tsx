"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Book } from "@/lib/types";
import { GENRE_ORDER } from "@/lib/room-plan";
import {
  crossTags,
  filterLabel,
  matches,
  profileOf,
  shelfInfo,
  tagsFor,
  type Filter,
} from "@/lib/genres";
import { BookPopup } from "./BookPopup";
import { ShelfBrowser } from "./ShelfBrowser";
import { initialPlace, usePlace } from "./use-place";
import type { Place } from "@/lib/links";
import { hoverTip } from "./input-state";
import type { FocusRequest } from "./CameraRig";

const LibraryScene = dynamic(() => import("./LibraryScene").then((mod) => mod.LibraryScene), { ssr: false });

type Mode = "checking" | "room" | "small" | "webgl";

/** Chips shown before "More" — enough to scan, few enough to read at a glance. */
const CHIP_LIMIT = 7;

let cachedMode: Mode | null = null;

function readMode(): Mode {
  if (cachedMode) return cachedMode;
  if (window.innerWidth < 1100 || window.innerHeight < 700) {
    cachedMode = "small";
    return cachedMode;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    cachedMode = gl ? "room" : "webgl";
  } catch {
    cachedMode = "webgl";
  }
  return cachedMode;
}

function subscribeMode() {
  return () => {};
}

/** Where the camera should be for a given place in the library. */
function focusFor(place: Place, books: Book[]): FocusRequest {
  if (place.bookId) return { id: place.bookId, intent: "open" };
  const filter = place.filter;
  if (filter?.kind === "shelf") return { id: filter.shelf, intent: "section" };
  if (filter?.kind === "tag") {
    const ids = books.filter((book) => matches(book, filter)).map((book) => book.id);
    return { id: `tag:${filter.tag}`, intent: "frame", ids };
  }
  return null;
}

export function LibraryExperience({ initialBooks }: { initialBooks: Book[] }) {
  const [books] = useState(initialBooks);
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "checking" as Mode);
  const [focus, setFocus] = useState<FocusRequest>(() => focusFor(initialPlace(books), books));
  const [popup, setPopup] = useState(false);
  // Arriving on a link skips the intro and goes straight to the book or shelf.
  const [skipIntro, setSkipIntro] = useState(() => {
    const arrived = initialPlace(books);
    return Boolean(arrived.bookId || arrived.filter);
  });
  const { place, go } = usePlace(books, (next, previous) => {
    // Back and forward buttons: move the camera to match the address.
    setPopup(false);
    if (next.bookId || next.filter) setFocus(focusFor(next, books));
    else if (previous.bookId) setFocus(null);
    else setFocus({ id: "room", intent: "home" });
  });
  const filter = place.filter;
  const [introDone, setIntroDone] = useState(false);
  const [moved, setMoved] = useState(false);
  const [query, setQuery] = useState("");
  const [moreChips, setMoreChips] = useState(false);
  const [peekId, setPeekId] = useState<string | null>(null);
  const [audioOn, setAudioOn] = useState(false);
  const [audioNote, setAudioNote] = useState<string | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const reducedMotion = useMemo(
    () => (typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false),
    [],
  );

  useEffect(() => {
    hoverTip.el = tipRef.current;
    return () => {
      hoverTip.el = null;
    };
  }, [mode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioOn) {
      audio.pause();
      return;
    }
    void audio.play().catch(() => {
      setAudioOn(false);
      setAudioNote("Room tone isn't available right now.");
    });
  }, [audioOn]);

  const results = useMemo(() => rank(books, query), [books, query]);
  const genres = useMemo(() => {
    const present = new Set(books.map((book) => book.genre));
    const known = GENRE_ORDER.filter((genre) => present.has(genre));
    const extra = [...present].filter((genre) => !known.includes(genre as (typeof GENRE_ORDER)[number]));
    return [...known, ...extra];
  }, [books]);

  const matched = useMemo(() => (filter ? books.filter((book) => matches(book, filter)) : []), [books, filter]);
  // Hovering a shelf name in the rail previews that section on the wall without moving the camera.
  const [previewShelf, setPreviewShelf] = useState<string | null>(null);
  const litIds = useMemo(() => {
    if (previewShelf) {
      return new Set(books.filter((book) => matches(book, { kind: "shelf", shelf: previewShelf, tag: null })).map((book) => book.id));
    }
    return filter ? new Set(matched.map((book) => book.id)) : null;
  }, [books, filter, matched, previewShelf]);
  const activeShelf = previewShelf ?? (filter?.kind === "shelf" ? filter.shelf : null);

  const shelfBooks = useMemo(
    () => (filter?.kind === "shelf" ? books.filter((book) => matches(book, { kind: "shelf", shelf: filter.shelf, tag: null })) : []),
    [books, filter],
  );
  const chips = useMemo(
    () => (filter?.kind === "shelf" ? tagsFor(shelfBooks) : crossTags(books)),
    [books, filter, shelfBooks],
  );


  const openBook = books.find((book) => book.id === focus?.id && popup) ?? null;

  function choose(id: string) {
    setPopup(false);
    setQuery("");
    setFocus({ id, intent: "highlight" });
  }

  function setFilter(next: Filter) {
    go({ filter: next, bookId: null });
  }

  function openFromShelf(id: string) {
    setPopup(false);
    go({ bookId: id });
    setFocus({ id, intent: "open" });
  }

  function closeBook() {
    setPopup(false);
    go({ bookId: null });
    setFocus(null);
  }

  const showRoom = useCallback(() => {
    setPopup(false);
    setQuery("");
    go({ filter: null, bookId: null });
    setMoreChips(false);
    setFocus({ id: "room", intent: "home" });
  }, [go]);

  const showShelf = useCallback(
    (genre: string) => {
      setPopup(false);
      setQuery("");
      go({ filter: { kind: "shelf", shelf: genre, tag: null }, bookId: null });
      setMoreChips(false);
      setFocus({ id: genre, intent: "section" });
    },
    [go],
  );

  function pickTag(tag: string | null) {
    setPopup(false);
    setQuery("");
    if (filter?.kind === "shelf") {
      setFilter({ ...filter, tag: filter.tag === tag ? null : tag });
      return;
    }
    if (!tag || (filter?.kind === "tag" && filter.tag === tag)) {
      showRoom();
      return;
    }
    const next: Filter = { kind: "tag", tag };
    setFilter(next);
    const ids = books.filter((book) => matches(book, next)).map((book) => book.id);
    setFocus({ id: `tag:${tag}`, intent: "frame", ids });
  }

  function applyFromBook(next: Filter) {
    if (!next) return;
    setPopup(false);
    setFocus(null);
    if (next.kind === "shelf") {
      showShelf(next.shelf);
      return;
    }
    go({ filter: next, bookId: null });
    setMoreChips(false);
    const ids = books.filter((book) => matches(book, next)).map((book) => book.id);
    setFocus({ id: `tag:${next.tag}`, intent: "frame", ids });
  }

  // Escape steps back one level: subgenre → shelf → whole room. The open book handles its own Escape.
  useEffect(() => {
    if (popup) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.target instanceof HTMLInputElement && query) {
        setQuery("");
        return;
      }
      if (filter?.kind === "shelf" && filter.tag) go({ filter: { ...filter, tag: null } });
      else if (filter) showRoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filter, go, popup, query, showRoom]);

  if (mode === "checking") {
    return (
      <main className="boot">
        <p>The Library</p>
      </main>
    );
  }
  if (mode === "small" || mode === "webgl") {
    return <ShelfBrowser books={books} place={place} go={go} variant={mode === "small" ? "phone" : "webgl"} />;
  }
  if (place.view === "list") {
    return <ShelfBrowser books={books} place={place} go={go} variant="list" onRoom={() => go({ view: "room", bookId: null })} />;
  }

  const shelf = filter?.kind === "shelf" ? shelfInfo(filter.shelf) : null;
  const elsewhere = filter?.kind === "shelf" ? matched.filter((book) => book.genre !== filter.shelf) : [];
  const listed = filter?.kind === "tag" || (filter?.kind === "shelf" && filter.tag) ? matched : elsewhere;
  // A shelf's long name shares the row with its chips, so it shows fewer before "more".
  const chipLimit = shelf ? CHIP_LIMIT - 1 : CHIP_LIMIT;
  const visibleChips = moreChips ? chips : chips.slice(0, chipLimit);
  const activeTag = filter?.kind === "tag" ? filter.tag : filter?.kind === "shelf" ? filter.tag : null;

  return (
    <main className={`stage ${popup ? "book-open" : ""}`}>
      <LibraryScene
        books={books}
        focus={focus}
        popup={popup}
        reducedMotion={reducedMotion}
        skipIntro={skipIntro}
        litIds={litIds}
        peekId={peekId}
        shelfLabel={(genre) => shelfInfo(genre).label}
        activeShelf={activeShelf}
        onShelf={showShelf}
        onOpen={openFromShelf}
        onArrive={() => setPopup(true)}
        onIntroDone={() => setIntroDone(true)}
        onInteract={() => {
          setMoved(true);
          setFocus((current) => (current?.intent === "highlight" ? null : current));
        }}
      />
      <div ref={tipRef} className="spine-tip" />
      <header className="hud" aria-hidden={popup}>
        <div className="hud-left">
          <form
            className="search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const best = results[0];
              if (best) choose(best.book.id);
            }}
          >
            <label>
              <span>Search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Title, author, or subgenre"
                aria-label="Search the shelves"
              />
            </label>
            {query.trim() && (
              <ul>
                {results.length === 0 && (
                  <li className="empty">
                    Nothing on the shelves matches “{query.trim()}”. Try an author, or a subgenre like magical realism.
                  </li>
                )}
                {results.map(({ book }) => (
                  <li key={book.id}>
                    <button type="button" onClick={() => choose(book.id)}>
                      <strong>{book.title}</strong>
                      <em>
                        {book.author} · {shelfInfo(book.genre).label}
                      </em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {filter && !query.trim() && listed.length > 0 && (
            <section className="results" aria-live="polite">
              <header>
                <p>
                  <strong>{filter.kind === "shelf" && !filter.tag ? "Also on this list" : filterLabel(filter)}</strong>
                  <span>
                    {filter.kind === "shelf" && !filter.tag
                      ? `${listed.length} shelved elsewhere`
                      : `${listed.length} ${listed.length === 1 ? "book" : "books"}, lit on the wall`}
                  </span>
                </p>
                <button type="button" className="clear" onClick={showRoom}>
                  Clear
                </button>
              </header>
              <ul>
                {listed.map((book) => (
                  <li key={book.id}>
                    <button
                      type="button"
                      onClick={() => choose(book.id)}
                      onMouseEnter={() => setPeekId(book.id)}
                      onMouseLeave={() => setPeekId(null)}
                      onFocus={() => setPeekId(book.id)}
                      onBlur={() => setPeekId(null)}
                    >
                      <strong>{book.title}</strong>
                      <em>
                        {book.author}
                        {(filter.kind === "tag" || book.genre !== filter.shelf) && <> · on {shelfInfo(book.genre).label}</>}
                      </em>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <nav className="hud-right" aria-label="Shelves">
          <div className="rail">
            <button type="button" className={!filter ? "current" : ""} aria-current={!filter} onClick={showRoom}>
              Whole room
            </button>
            {genres.map((genre) => {
              const info = shelfInfo(genre);
              const current = filter?.kind === "shelf" && filter.shelf === genre;
              return (
                <button
                  key={genre}
                  type="button"
                  title={info.name}
                  className={current ? "current" : ""}
                  aria-current={current}
                  onClick={() => {
                    setPreviewShelf(null);
                    showShelf(genre);
                  }}
                  onMouseEnter={() => setPreviewShelf(genre)}
                  onMouseLeave={() => setPreviewShelf(null)}
                  onFocus={() => setPreviewShelf(genre)}
                  onBlur={() => setPreviewShelf(null)}
                >
                  {info.label}
                </button>
              );
            })}
          </div>

          <div className={`subrail ${moreChips ? "open" : ""}`}>
            <p className="context" title={shelf ? `${shelf.name}. ${shelf.blurb}` : undefined}>
              {shelf ? (
                <span>
                  {shelfBooks.length} books
                  {elsewhere.length > 0 && <> · {elsewhere.length} shelved elsewhere</>}
                </span>
              ) : (
                <>
                  <strong>Browse by subgenre</strong>
                </>
              )}
            </p>
            {chips.length > 0 && (
              <div className="chips" role="group" aria-label="Subgenres">
                {shelf && (
                  <button type="button" className={!activeTag ? "on" : ""} aria-pressed={!activeTag} onClick={() => pickTag(null)}>
                    All
                  </button>
                )}
                {visibleChips.map(({ tag, count }) => (
                  <button
                    key={tag}
                    type="button"
                    className={activeTag === tag ? "on" : ""}
                    aria-pressed={activeTag === tag}
                    onClick={() => pickTag(tag)}
                  >
                    {tag}
                    <em>{count}</em>
                  </button>
                ))}
                {chips.length > chipLimit && (
                  <button type="button" className="more" aria-expanded={moreChips} onClick={() => setMoreChips((value) => !value)}>
                    {moreChips ? "Fewer" : `${chips.length - chipLimit} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
      {!introDone && (
        <button className="intro" type="button" onClick={() => setSkipIntro(true)}>
          <span>A private collection</span>
          <strong>The Library</strong>
          <em>Enter</em>
        </button>
      )}
      {introDone && (
        <p className={`hint ${moved ? "quiet" : ""}`}>
          Drag to look · A / D to walk · Scroll to step closer · Click a spine to open it
        </p>
      )}
      <button className="list-toggle" type="button" onClick={() => go({ view: "list", bookId: null })}>
        List view
      </button>
      <button
        className={`tone ${audioOn ? "on" : ""}`}
        type="button"
        aria-pressed={audioOn}
        onClick={() => {
          setAudioNote(null);
          setAudioOn((value) => !value);
        }}
      >
        <i aria-hidden="true" />
        Room tone
      </button>
      {audioNote && (
        <p className="tone-note" role="status">
          {audioNote}
        </p>
      )}
      <audio
        ref={audioRef}
        src="/audio/ambience.wav"
        loop
        preload="none"
        onError={() => {
          setAudioOn(false);
          setAudioNote("Room tone isn't available right now.");
        }}
      />
      {openBook && <BookPopup book={openBook} onClose={closeBook} onFilter={applyFromBook} />}
    </main>
  );
}

function rank(books: Book[], query: string): { book: Book; score: number }[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return books
    .map((book) => {
      const title = book.title.toLowerCase();
      const author = book.author.toLowerCase();
      const profile = profileOf(book);
      const shelves = profile.shelves.map((id) => `${id} ${shelfInfo(id).label}`).join(" ").toLowerCase();
      const kinds = [...profile.tags, ...profile.subgenres].join(" ").toLowerCase();
      let score = 0;
      if (title === needle) score = 100;
      else if (title.startsWith(needle)) score = 86;
      else if (title.includes(needle)) score = 74;
      else if (author.includes(needle)) score = 60;
      else if (shelves.includes(needle)) score = 46;
      else if (kinds.includes(needle)) score = 40;
      return { book, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, 6);
}
