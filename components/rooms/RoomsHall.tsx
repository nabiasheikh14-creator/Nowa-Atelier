"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { HallBook, HallRoom } from "@/lib/rooms";
import { spineArt, spineTitle } from "@/lib/spine-design";
import { hashString } from "@/lib/random";

export type HallViewer = { handle: string; visibility: "private" | "unlisted" | "public" } | null;
type Room = HallRoom & { href: string };
type Sort = "reading" | "books" | "newest";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const SORTS: { value: Sort; label: string }[] = [
  { value: "reading", label: "Reading now" },
  { value: "books", label: "Most books" },
  { value: "newest", label: "Newest" },
];

/** The hall: one small cabinet per public room, its real spines on the shelves. */
export function RoomsHall({ rooms, viewer, roomsOpen }: { rooms: Room[]; viewer: HallViewer; roomsOpen: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("reading");
  const [entering, setEntering] = useState<string | null>(null);
  // Fixed at first render, so "lit this week" doesn't flicker between server and browser.
  const [now] = useState(() => Date.now());

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matching = needle
      ? rooms.filter((room) =>
          [room.display_name, room.handle, room.bio ?? "", ...room.shelf.map((book) => book.title), ...room.reading.map((book) => book.title)]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : rooms;
    const active = (room: Room) => (room.last_active ? Date.parse(room.last_active) : 0);
    return [...matching].sort((a, b) => {
      if (sort === "books") return b.book_count - a.book_count;
      if (sort === "newest") return Date.parse(b.created_at) - Date.parse(a.created_at);
      return Number(b.reading.length > 0) - Number(a.reading.length > 0) || active(b) - active(a);
    });
  }, [query, rooms, sort]);

  function enter(event: React.MouseEvent<HTMLAnchorElement>, room: Room) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    setEntering(room.id);
    window.setTimeout(() => router.push(room.href), 480);
  }

  const showInvite = roomsOpen && !query.trim() && viewer?.visibility !== "public";

  return (
    <main className={`hall ${entering ? "is-entering" : ""}`}>
      <header className="hall-head">
        <p className="kicker">The Library</p>
        <h1>Rooms</h1>
        <p className="lede">Look along the shelves. Step into any room.</p>
        <div className="hall-tools">
          <label className="hall-search">
            <span className="sr-only">Search rooms</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, handle, or a book" />
          </label>
          <div className="segmented dark" role="radiogroup" aria-label="Sort rooms">
            {SORTS.map((option) => (
              <button key={option.value} type="button" role="radio" aria-checked={sort === option.value} className={sort === option.value ? "on" : ""} onClick={() => setSort(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
          <span className="hall-links">
            <Link className="sv-room" href="/">
              The library
            </Link>
            {roomsOpen && (
              <Link className="sv-room" href={viewer ? `/@${viewer.handle}` : "/join"}>
                {viewer ? "Your room" : "Make your own room"}
              </Link>
            )}
          </span>
        </div>
      </header>

      <ul className="hall-floor" aria-label="Rooms">
        {shown.map((room) => (
          <li key={room.id} className={entering === room.id ? "entering" : ""}>
            <Cabinet room={room} lit={room.last_active ? now - Date.parse(room.last_active) < WEEK : false} onEnter={(event) => enter(event, room)} />
          </li>
        ))}
        {showInvite && (
          <li>
            <Link className="cabinet invite" href={viewer ? `/@${viewer.handle}` : "/join"}>
              <span className="invite-body">
                <strong>{viewer ? "Your room isn't in the hall" : "Your room could stand here"}</strong>
                <em>
                  {viewer
                    ? `It's ${viewer.visibility === "private" ? "private" : "only open to people with the link"}. Make it public in Room settings.`
                    : "Shelve your books, or bring them over from Goodreads."}
                </em>
              </span>
              <span className="cab-plaque">
                <strong>{viewer ? "Go to your room" : "Make a room"}</strong>
              </span>
            </Link>
          </li>
        )}
      </ul>

      {shown.length === 0 && query.trim() && <p className="lede hall-empty">No room matches “{query.trim()}”. Try a name, a handle, or a book title.</p>}
      <div className="hall-fade" aria-hidden="true" />
    </main>
  );
}

function Cabinet({ room, lit, onEnter }: { room: Room; lit: boolean; onEnter: (event: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const rows = [room.shelf.slice(0, 9), room.shelf.slice(9, 18)];
  const reading = room.reading[0];
  const empty = room.book_count === 0;
  const label = `${room.display_name}'s library, ${room.book_count} ${room.book_count === 1 ? "book" : "books"}${
    reading ? `, reading ${reading.title}` : ""
  }`;
  return (
    <Link className={`cabinet ${lit ? "lit" : ""}`} href={room.href} onClick={onEnter} aria-label={label}>
      <span className="cab-top" aria-hidden="true">
        {lit && <i className="cab-lamp" />}
        {reading && <LyingBook book={reading} />}
      </span>
      <span className="cab-body" aria-hidden="true">
        {empty ? (
          <span className="cab-sheet">Just moved in</span>
        ) : (
          rows.map((row, index) => (
            <span key={index} className="cab-shelf">
              {row.map((book) => (
                <MiniSpine key={`${book.title}|${book.author}`} book={book} />
              ))}
              {row.length > 0 && row.length < 9 && <i className="cab-bookend" />}
            </span>
          ))
        )}
      </span>
      <span className="cab-plaque">
        <strong>{room.display_name}&apos;s library</strong>
        <span>
          @{room.handle} · {room.book_count} {room.book_count === 1 ? "book" : "books"}
        </span>
      </span>
      {reading && (
        <span className="cab-reading">
          <i>Reading now</i> {reading.title}
        </span>
      )}
      {room.bio && <span className="cab-bio">{room.bio}</span>}
    </Link>
  );
}

function MiniSpine({ book }: { book: HallBook }) {
  const art = spineArt(book.title);
  const seed = hashString(book.title);
  return (
    <i
      className={`mini-spine ${art.layout}`}
      style={{
        ["--ground" as string]: art.ground,
        ["--ink" as string]: art.ink,
        ["--band" as string]: art.band,
        height: 60 + (seed % 18),
        width: Math.max(11, Math.min(18, 9 + book.title.length * 0.35)),
      }}
    >
      <b>{spineTitle(book.title, art)}</b>
    </i>
  );
}

/** The current read, lying flat on top of the cabinet, spine out. */
function LyingBook({ book }: { book: HallBook }) {
  const art = spineArt(book.title);
  return (
    <span className="lying-book" style={{ ["--ground" as string]: art.ground, ["--ink" as string]: art.ink, ["--band" as string]: art.band }}>
      {book.title}
    </span>
  );
}
