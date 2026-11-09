"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Book } from "@/lib/types";
import { GENRE_ORDER } from "@/lib/room-plan";
import { BookPopup } from "./BookPopup";
import { FallbackLibrary } from "./FallbackLibrary";
import { hoverTip } from "./input-state";
import type { FocusRequest } from "./CameraRig";

const LibraryScene = dynamic(() => import("./LibraryScene").then((mod) => mod.LibraryScene), { ssr: false });

type Mode = "checking" | "room" | "small" | "webgl";

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

export function LibraryExperience({ initialBooks }: { initialBooks: Book[] }) {
  const [books] = useState(initialBooks);
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "checking" as Mode);
  const [focus, setFocus] = useState<FocusRequest>(null);
  const [popup, setPopup] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const [query, setQuery] = useState("");
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
    void audio.play().catch(() => setAudioNote("The room tone could not start."));
  }, [audioOn]);

  const results = useMemo(() => rank(books, query), [books, query]);
  const genres = useMemo(() => {
    const present = new Set(books.map((book) => book.genre));
    const known = GENRE_ORDER.filter((genre) => present.has(genre));
    const extra = [...present].filter((genre) => !known.includes(genre as (typeof GENRE_ORDER)[number]));
    return [...known, ...extra];
  }, [books]);
  const openBook = books.find((book) => book.id === focus?.id && popup) ?? null;

  function choose(id: string) {
    setPopup(false);
    setQuery("");
    setFocus({ id, intent: "highlight" });
  }

  function openFromShelf(id: string) {
    setPopup(false);
    setFocus({ id, intent: "open" });
  }

  function closeBook() {
    setPopup(false);
    setFocus(null);
  }

  function showRoom() {
    setPopup(false);
    setQuery("");
    setFocus({ id: "room", intent: "home" });
  }

  function showGenre(genre: string) {
    setPopup(false);
    setQuery("");
    setFocus({ id: genre, intent: "section" });
  }

  if (mode === "checking") {
    return (
      <main className="boot">
        <p>The Library</p>
      </main>
    );
  }
  if (mode === "small" || mode === "webgl") {
    return <FallbackLibrary books={books} reason={mode === "small" ? "small" : "webgl"} />;
  }

  return (
    <main className="stage">
      <LibraryScene
        books={books}
        focus={focus}
        popup={popup}
        reducedMotion={reducedMotion}
        skipIntro={skipIntro}
        onOpen={openFromShelf}
        onArrive={() => setPopup(true)}
        onIntroDone={() => setIntroDone(true)}
        onInteract={() => setFocus((current) => (current?.intent === "highlight" ? null : current))}
      />
      <div ref={tipRef} className="spine-tip" />
      <header className="hud">
        <form
          className="search"
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
              placeholder="Title, author, or genre"
              aria-label="Search the shelves"
            />
          </label>
          {query.trim() && (
            <ul>
              {results.length === 0 && <li className="empty">No volume by that name.</li>}
              {results.map(({ book }) => (
                <li key={book.id}>
                  <button type="button" onClick={() => choose(book.id)}>
                    <strong>{book.title}</strong>
                    <em>
                      {book.author} · {book.genre}
                    </em>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="rail">
          <button type="button" className={!focus || focus.intent === "home" ? "current" : ""} onClick={showRoom}>
            Whole room
          </button>
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              className={focus?.intent === "section" && focus.id === genre ? "current" : ""}
              onClick={() => showGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </header>
      {!introDone && (
        <button className="intro" type="button" onClick={() => setSkipIntro(true)}>
          <span>A private collection</span>
          <strong>The Library</strong>
          <em>Enter</em>
        </button>
      )}
      {introDone && (
        <p className="hint">Drag to look · A and D along the shelves · W and S or scroll to step closer</p>
      )}
      <Link className="keeper" href="/admin">
        Keeper
      </Link>
      <button
        className={`tone ${audioOn ? "on" : ""}`}
        type="button"
        aria-pressed={audioOn}
        onClick={() => {
          setAudioNote(null);
          setAudioOn((value) => !value);
        }}
        title="Placeholder room tone. Replace public/audio/ambience.wav."
      >
        Room tone
      </button>
      {audioNote && <p className="tone-note">{audioNote}</p>}
      <audio
        ref={audioRef}
        src="/audio/ambience.wav"
        loop
        preload="none"
        onError={() => setAudioNote("Placeholder — add a recording at public/audio/ambience.wav.")}
      />
      {openBook && <BookPopup book={openBook} onClose={closeBook} />}
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
      const genre = book.genre.toLowerCase();
      let score = 0;
      if (title === needle) score = 100;
      else if (title.startsWith(needle)) score = 86;
      else if (title.includes(needle)) score = 74;
      else if (author.includes(needle)) score = 60;
      else if (genre.includes(needle)) score = 46;
      return { book, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.book.title.localeCompare(b.book.title))
    .slice(0, 6);
}
